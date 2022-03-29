"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const morgan_1 = __importDefault(require("morgan"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const pg_1 = require("pg");
const moment_1 = __importDefault(require("moment"));
require("@polkadot/api-augment");
const api_1 = require("@polkadot/api");
const postgresConnParams = {
    user: process.env.POSTGRES_USER || 'polkastats',
    host: process.env.POSTGRES_HOST || 'postgres',
    database: process.env.POSTGRES_DATABASE || 'polkastats',
    password: process.env.POSTGRES_PASSWORD || 'polkastats',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
};
const port = process.env.PORT || 8000;
const wsProviderUrl = 'ws://substrate-node:9944';
const polkassemblyGraphQL = 'https://kusama.polkassembly.io/v1/graphql';
const app = (0, express_1.default)();
// middleware
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
const getClient = async () => {
    const client = new pg_1.Client(postgresConnParams);
    await client.connect();
    return client;
};
const getPolkadotAPI = async () => {
    const provider = new api_1.WsProvider(wsProviderUrl);
    const api = await api_1.ApiPromise.create({ provider });
    await api.isReady;
    return api;
};
// from https://stackoverflow.com/questions/60504945/javascript-encode-decode-utf8-to-hex-and-hex-to-utf8
const hexToUtf8 = (s) => {
    return decodeURIComponent(s
        .replace(/\s+/g, '') // remove spaces
        .replace(/[0-9a-f]{2}/g, '%$&'));
};
//
// Example query: /api/v1/block?page[size]=5
//
app.get('/api/v1/block', async (req, res) => {
    const client = await getClient();
    try {
        const pageSize = req.query.page.size;
        const query = `
      SELECT
        block_number,
        block_hash,
        timestamp
      FROM block
      WHERE finalized IS TRUE
      ORDER BY block_number DESC
      LIMIT $1
    ;`;
        const dbres = await client.query(query, [pageSize]);
        if (dbres.rows.length > 0) {
            const data = dbres.rows.map((row) => {
                return {
                    attributes: {
                        id: parseInt(row.block_number),
                        hash: row.block_hash,
                        datetime: moment_1.default.unix(row.timestamp).format(), // 2021-08-06T13:53:18+00:00
                    },
                };
            });
            res.send({
                status: true,
                message: 'Request was successful',
                data,
            });
        }
        else {
            res.send({
                status: false,
                message: 'There was an error processing your request',
            });
        }
    }
    catch (error) {
        res.send({
            status: false,
            message: 'There was an error processing your request',
        });
    }
    finally {
        await client.end();
    }
});
//
// Council Bat-Signal App API
//
// Get sytem.remarks extrinsics in the last 8 hours
//
app.get('/api/v1/batsignal/system.remarks', async (_req, res) => {
    const client = await getClient();
    try {
        const api = await getPolkadotAPI();
        const councilMembers = await api.query.council.members();
        const technicalCommitteeMembers = await api.query.technicalCommittee.members();
        await api.disconnect();
        const councilAndTCAddresses = JSON.parse(JSON.stringify(councilMembers.concat(technicalCommitteeMembers)));
        const timestamp = Math.floor(Date.now() / 1000 - 28800); // last 8h
        const query = `
      SELECT
        block_number,
        hash,
        signer,
        args,
        timestamp
      FROM extrinsic
      WHERE
        section = 'system' AND
        method = 'remark' AND
        success IS TRUE AND
        timestamp >= $1 AND
        signer = ANY ($2)
      ORDER BY block_number DESC
    ;`;
        const dbres = await client.query(query, [timestamp, councilAndTCAddresses]);
        if (dbres.rows.length > 0) {
            const data = dbres.rows.map((row) => {
                const remarkMessage = hexToUtf8(JSON.parse(row.args)[0]);
                return {
                    block_number: parseInt(row.block_number),
                    extrinsic_hash: row.hash,
                    signer: row.signer,
                    remark: remarkMessage.startsWith('0x')
                        ? remarkMessage.substring(2)
                        : remarkMessage,
                    datetime: moment_1.default.unix(row.timestamp).format(), // 2021-08-06T13:53:18+00:00
                };
            });
            res.send({
                status: true,
                message: 'Request was successful',
                data,
            });
        }
        else {
            res.send({
                status: true,
                message: 'Request was successful',
                data: [],
            });
        }
    }
    catch (error) {
        console.log(error);
        res.send({
            status: false,
            message: 'There was an error processing your request',
        });
    }
    finally {
        await client.end();
    }
});
//
// Council Bat-Signal App API
//
// Get council.Proposed events in the last 8 hours
//
// Proposed(AccountId, ProposalIndex, Hash, MemberCount)#
// interface: api.events.council.Proposed.is
// summary: A motion (given hash) has been proposed (by given account) with a threshold (given MemberCount). [account, proposal_index, proposal_hash, threshold]
//
app.get('/api/v1/batsignal/council-events', async (_req, res) => {
    const client = await getClient();
    try {
        // const timestamp = Math.floor((Date.now() / 1000) - 28800); // last 8h
        const timestamp = Math.floor(Date.now() / 1000 - 30 * 24 * 60 * 60); // last 30d
        const query = `
      SELECT
        block_number,
        section,
        method,
        data,
        timestamp
      FROM event
      WHERE
        section = 'council' AND
        method = 'Proposed' AND
        timestamp >= $1
      ORDER BY block_number DESC
    ;`;
        const dbres = await client.query(query, [timestamp]);
        if (dbres.rows.length > 0) {
            const data = [];
            for (const row of dbres.rows) {
                const proposalId = JSON.parse(row.data)[1];
                const graphQlQuery = `
          query {
            posts(where: {onchain_link: {onchain_motion_id: {_eq: ${proposalId}}}}) {
              title
              content
              onchain_link {
                proposer_address
                onchain_motion_id
              }
            }
          }`;
                let title = '';
                let content = '';
                try {
                    // @ts-ignore
                    const response = await (0, node_fetch_1.default)(polkassemblyGraphQL, {
                        method: 'POST',
                        body: JSON.stringify({ query: graphQlQuery }),
                    });
                    const body = await response.text();
                    title = JSON.parse(body).data.posts[0].title;
                    content = JSON.parse(body).data.posts[0].content;
                }
                catch (error) {
                    console.error(error);
                }
                data.push({
                    block_number: parseInt(row.block_number),
                    section: row.section,
                    method: row.method,
                    data: row.data,
                    proposal_id: proposalId,
                    title,
                    content,
                    polkassembly_link: `https://kusama.polkassembly.io/motion/${proposalId}`,
                    timestamp: row.timestamp,
                    datetime: moment_1.default.unix(row.timestamp).format(), // 2021-08-06T13:53:18+00:00
                });
            }
            res.send({
                status: true,
                message: 'Request was successful',
                data,
            });
        }
        else {
            res.send({
                status: true,
                message: 'Request was successful',
                data: [],
            });
        }
    }
    catch (error) {
        res.send({
            status: false,
            message: 'There was an error processing your request',
        });
    }
    finally {
        await client.end();
    }
});
// transfers in the last 30 days
app.get('/api/v1/charts/transfers', async (_req, res) => {
    const history = 30;
    const timestamps = [];
    const timePeriods = [];
    const chartData = [];
    const now = (0, moment_1.default)();
    // today at 00:00:00.000
    const iterator = (0, moment_1.default)().set({
        year: now.year(),
        month: now.month(),
        date: now.date(),
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
    });
    iterator.subtract(history, 'days');
    for (let offset = 1; offset <= history; offset++) {
        iterator.add(1, 'days');
        timestamps.push([
            iterator.format('YYYY-MM-DD'),
            iterator.valueOf(), // timestamp in ms
        ]);
    }
    timestamps.push([
        now.format('YYYY-MM-DD'),
        now.valueOf(), // timestamp in ms
    ]);
    for (let index = 0; index < timestamps.length - 1; index++) {
        timePeriods.push({
            date: timestamps[index][0],
            fromTimestamp: timestamps[index][1],
            toTimestamp: timestamps[index + 1][1],
        });
    }
    const client = await getClient();
    const query = 'SELECT count(block_number) AS transfers FROM transfer WHERE timestamp >= $1 AND timestamp < $2;';
    const transferData = await Promise.all(timePeriods.map((timePeriod) => client.query(query, [timePeriod.fromTimestamp, timePeriod.toTimestamp])));
    for (let index = 0; index < timestamps.length - 1; index++) {
        chartData.push({
            date: timePeriods[index].date,
            fromTimestamp: timePeriods[index].fromTimestamp,
            toTimestamp: timePeriods[index].toTimestamp,
            transfers: transferData[index].rows[0].transfers,
        });
    }
    await client.end();
    res.send({
        status: true,
        message: 'Request was successful',
        data: chartData,
    });
});
// Start app
app.listen(port, () => console.log(`PolkaStats API is listening on port ${port}.`));
