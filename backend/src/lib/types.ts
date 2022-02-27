import { AnyTuple } from '@polkadot/types/types';
import { GenericExtrinsic } from '@polkadot/types';
import { EventRecord } from '@polkadot/types/interfaces';

export interface CrawlerConfig {
  name: string;
  enabled: boolean;
  crawler: string;
  apiCustomTypes?: string;
  startDelay?: number;
  mode?: string;
  chunkSize?: number;
  statsPrecision?: number;
  pollingTime?: number;
  historySize?: number;
  erasPerDay?: number;
  tokenDecimals?: number;
  featuredTimespan?: number;
}

export interface BackendConfig {
  substrateNetwork: string;
  wsProviderUrl: string;
  postgresConnParams: {
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
  };
  logLevel: string;
  sentryDSN: string;
  substrateApiSidecar: string;
  crawlers: CrawlerConfig[];
}

export interface LoggerOptions {
  crawler: string;
}

export interface IdentityInfo {
  verifiedIdentity: boolean;
  hasSubIdentity: boolean;
  name: string;
  identityRating: number;
}

export interface CommisionHistoryItem {
  era: string;
  commission: string;
}

export interface ClusterInfo {
  clusterName: string;
  clusterMembers: number;
}

export type IndexedBlockEvent = [number, EventRecord];
export type IndexedBlockExtrinsic = [number, GenericExtrinsic<AnyTuple>];
