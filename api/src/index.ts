// @ts-check
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import fetch from 'node-fetch';
import { Client } from 'pg';
import moment from 'moment';
import '@polkadot/api-augment';
import { ApiPromise, WsProvider } from '@polkadot/api';

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
const app = express();

// middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

const getClient = async (): Promise<Client> => {
  const client = new Client(postgresConnParams);
  await client.connect();
  return client;
};

const getPolkadotAPI = async (): Promise<ApiPromise> => {
  console.log(`Connecting to ${wsProviderUrl}`);
  const provider = new WsProvider(wsProviderUrl);
  const api = await ApiPromise.create({ provider });
  await api.isReady;
  return api;
};

// from https://stackoverflow.com/questions/60504945/javascript-encode-decode-utf8-to-hex-and-hex-to-utf8
const hexToUtf8 = (s: string) => {
  return decodeURIComponent(
    s
      .replace(/\s+/g, '') // remove spaces
      .replace(/[0-9a-f]{2}/g, '%$&'), // add '%' before each 2 characters
  );
};

//
// Example query: /api/v1/block?page[size]=5
//
app.get('/api/v1/block', async (req: any, res) => {
  try {
    const pageSize = req.query.page.size;
    const client = await getClient();
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
            datetime: moment.unix(row.timestamp).format(), // 2021-08-06T13:53:18+00:00
          },
        };
      });
      res.send({
        status: true,
        message: 'Request was successful',
        data,
      });
    } else {
      res.send({
        status: false,
        message: 'There was an error processing your request',
      });
    }
    await client.end();
  } catch (error) {
    res.send({
      status: false,
      message: 'There was an error processing your request',
    });
  }
});

//
// Council Bat-Signal App API
//
// Get sytem.remarks extrinsics in the last 8 hours
//
app.get('/api/v1/batsignal/system.remarks', async (_req, res) => {
  try {
    const api = await getPolkadotAPI();
    const councilMembers = await api.query.council.members();
    const technicalCommitteeMembers =
      await api.query.technicalCommittee.members();
    await api.disconnect();
    const councilAndTCAddresses = JSON.parse(
      JSON.stringify(councilMembers.concat(technicalCommitteeMembers)),
    );
    const timestamp = Math.floor(Date.now() / 1000 - 28800); // last 8h
    const client = await getClient();
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
          datetime: moment.unix(row.timestamp).format(), // 2021-08-06T13:53:18+00:00
        };
      });
      res.send({
        status: true,
        message: 'Request was successful',
        data,
      });
    } else {
      res.send({
        status: true,
        message: 'Request was successful',
        data: [],
      });
    }
    await client.end();
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: 'There was an error processing your request',
    });
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
  try {
    // const timestamp = Math.floor((Date.now() / 1000) - 28800); // last 8h
    const timestamp = Math.floor(Date.now() / 1000 - 30 * 24 * 60 * 60); // last 30d
    const client = await getClient();
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
          const response = await fetch(polkassemblyGraphQL, {
            method: 'POST',
            body: JSON.stringify({ query: graphQlQuery }),
          });
          const body = await response.text();
          title = JSON.parse(body).data.posts[0].title;
          content = JSON.parse(body).data.posts[0].content;
        } catch (error) {
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
          datetime: moment.unix(row.timestamp).format(), // 2021-08-06T13:53:18+00:00
        });
      }
      res.send({
        status: true,
        message: 'Request was successful',
        data,
      });
    } else {
      res.send({
        status: true,
        message: 'Request was successful',
        data: [],
      });
    }
    await client.end();
  } catch (error) {
    res.send({
      status: false,
      message: 'There was an error processing your request',
    });
  }
});

// transfers in the last 30 days
app.get('/api/v1/charts/transfers', async (_req, res) => {

  const history = 30;

  const timestamps = [];
  const timePeriods = [];
  const chartData = [];

  const now = moment();

  // today at 00:00:00.000
  const iterator = moment().set({
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
  const query =
    'SELECT count(block_number) AS transfers FROM transfer WHERE timestamp >= $1 AND timestamp < $2;';

  const transferData = await Promise.all(
    timePeriods.map((timePeriod) => client.query(query, [ timePeriod.fromTimestamp, timePeriod.toTimestamp ])),
  );

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
app.listen(port, () =>
  console.log(`PolkaStats API is listening on port ${port}.`),
);
