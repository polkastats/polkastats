import { backendConfig } from '../backend.config';
import pino from 'pino';

export const logger = pino({
  level: backendConfig.logLevel,
});
