const { Pool, Client } = require('pg');

const postgresConnParams = {
  user: process.env.POSTGRES_USER || 'polkastats',
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DATABASE || 'polkastats',
  password: process.env.POSTGRES_PASSWORD || 'polkastats',
  port: process.env.POSTGRES_PORT || 5432,
};

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

module.exports = getClient;