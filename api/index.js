const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { Pool, Client } = require('pg');
const axios = require('axios');
const moment = require('moment');

const postgresConnParams = {
  user: process.env.POSTGRES_USER || 'polkastats',
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DATABASE || 'polkastats',
  password: process.env.POSTGRES_PASSWORD || 'polkastats',
  port: process.env.POSTGRES_PORT || 5432,
};

// Http port
const port = process.env.PORT || 8000;

// Connnect to db
const getPool = async () => {
  const pool = new Pool(postgresConnParams);
  await pool.connect();
  return pool;
}

const getClient = async () => {
  const client = new Client(postgresConnParams);
  await client.connect();
  return client;
}


const app = express();

// Add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

// from https://stackoverflow.com/questions/60504945/javascript-encode-decode-utf8-to-hex-and-hex-to-utf8
const hexToUtf8 = (s) =>
{
  return decodeURIComponent(
     s.replace(/\s+/g, '') // remove spaces
      .replace(/[0-9a-f]{2}/g, '%$&') // add '%' before each 2 characters
  );
}

//
// Example query: /api/v1/block?page[size]=5
//
app.get('/api/v1/block', async (req, res) => {
  try {
    const pageSize = req.query.page.size;
    const pageOffset = 0;
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
      const data = dbres.rows.map(row => {
        return {
          attributes: {
            id: parseInt(row.block_number),
            hash: row.block_hash,
            datetime: moment.unix(row.timestamp).format(), // 2021-08-06T13:53:18+00:00
          }
        }
      });
      res.send({
        status: true,
        message: 'Request was successful',
        data,
      });
    } else {
      res.send({
        status: false,
        message: 'There was an error processing your request'
      });
    }
    await client.end();
  } catch (error) {
    res.send({
      status: false,
      message: 'There was an error processing your request'
    });
  }
});

//
// Council Bat-Signal App API
//
// Get sytem.remarks extrinsics in the last 24 hours
//
app.get('/api/v1/batsignal/system.remarks', async (req, res) => {
  try {
    const timestamp = Math.floor((Date.now() / 1000) - 86400); // last 24h
    const client = await getClient();
    const query = `
      SELECT
        block_number,
        hash,
        args,
        timestamp
      FROM extrinsic
      WHERE
        section = 'system' AND
        method = 'remark' AND
        success IS TRUE AND
        timestamp >= $1
      ORDER BY block_number DESC
    ;`;
    const dbres = await client.query(query, [timestamp]);
    if (dbres.rows.length > 0) {
      const data = dbres.rows.map(row => {
        return {
          block_number: parseInt(row.block_number),
          extrinsic_hash: row.hash,
          // args: row.args,
          remark: hexToUtf8(JSON.parse(row.args)[0]),
          datetime: moment.unix(row.timestamp).format(), // 2021-08-06T13:53:18+00:00
        }
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
    res.send({
      status: false,
      message: 'There was an error processing your request'
    });
  }
});

//
// Council Bat-Signal App API
//
// Get council.Proposed events in the last 24 hours
//
// Proposed(AccountId, ProposalIndex, Hash, MemberCount)# 
// interface: api.events.council.Proposed.is 
// summary: A motion (given hash) has been proposed (by given account) with a threshold (given MemberCount). [account, proposal_index, proposal_hash, threshold]
//

app.get('/api/v1/batsignal/council-events', async (req, res) => {
  try {
    const timestamp = Math.floor((Date.now() / 1000) - 86400); // last 24h
    const client = await getClient();
    const query = `
      SELECT
        block_number,
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
      const data = dbres.rows.map(row => {
        return {
          block_number: parseInt(row.block_number),
          data: row.data,
          datetime: moment.unix(row.timestamp).format(), // 2021-08-06T13:53:18+00:00
        }
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
    res.send({
      status: false,
      message: 'There was an error processing your request'
    });
  }
});


// Start app
app.listen(port, () => 
  console.log(`PolkaStats API is listening on port ${port}.`)
);
