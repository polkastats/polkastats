// @ts-check
import * as Sentry from '@sentry/node';
import { Client } from 'pg';
import { backendConfig } from '../backend.config';
import { logger } from './logger';
Sentry.init({
    dsn: backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
export const getClient = async (loggerOptions) => {
    logger.debug(loggerOptions, `Connecting to DB ${backendConfig.postgresConnParams.database} at ${backendConfig.postgresConnParams.host}:${backendConfig.postgresConnParams.port}`);
    const client = new Client(backendConfig.postgresConnParams);
    await client.connect();
    return client;
};
export const dbQuery = async (client, sql, loggerOptions) => {
    try {
        return await client.query(sql);
    }
    catch (error) {
        logger.error(loggerOptions, `SQL: ${sql} ERROR: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    }
    return null;
};
export const dbParamQuery = async (client, sql, data, loggerOptions) => {
    try {
        return await client.query(sql, data);
    }
    catch (error) {
        logger.error(loggerOptions, `SQL: ${sql} PARAM: ${JSON.stringify(data)} ERROR: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    }
    return null;
};
