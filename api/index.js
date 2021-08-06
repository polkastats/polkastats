const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { Pool } = require('pg');
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
const app = express();

// Add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

//
// Example query: /api/v1/block?page[size]=5
//
app.get('/api/v1/block', async (req, res) => {
  try {
    const pageSize = req.query.page.size;
    const pageOffset = 0;
    const pool = await getPool();
    const query = `
      SELECT
        block_number,
        block_hash,
        timestamp
      FROM block
      ORDER BY block_number DESC
      LIMIT $1
    ;`;
    const dbres = await pool.query(query, [pageSize]);
    if (dbres.rows.length > 0) {
      const data = dbres.rows.map(row => {
        return {
          attributes: {
            id: row.block_number,
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
