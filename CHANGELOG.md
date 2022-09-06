# Cere Stats

## vNext
- [BE] Implemented all errors catch to avoid app crash

## v0.21.0
- [BE] Implemented network monitoring API

## v0.20.0
- [BE] Moved blockchains config to `.env.default`
- [BE] Implemented liveness/readiness probes API

## v0.19.0
- Configured LiveOne accounts to provide their monitoring

## v0.18.0
- [BE] Hid "Thousand Validator Programme" under feature flag

## v0.17.0
- [BE] Implemented balances monitoring API
- [BE, FE] Updated Cere Blockchain public URLs

## v0.16.0
- [BE, FE] Added DDC metrics 
- [BE] Updated Devnet url
- [FE] Updated link to Cere Docs 

## v0.15.0

- [FE] Removed EDP banner
- [FE] Added "timestamp", "date_time" columns to sent transfers, received transfers export files
- [FE] Enabled multiple validators selection from the same cluster
- [FE] Changed "hand" to "star" for validators page, renamed "select" column to "favorites"

## v0.14.0

- Added health check API

## v0.13.0

- Updated Mainnet urls

## v0.12.0

- Updated QAnet/Testnet urls
- DDC metrics (includes ddc-metric migration that is compatible with the code previous version)

## v0.11.0

- Database migrations
- Added `update-transactions-fees-cast-type` migration (compatible with the previous code version)

## v0.10.0

- Added API (Prometheus compatible) to get blockchains accounts balances 

## v0.9.0

- Adjusted metrics

## v0.8.0

- Minor UI fixes

## v0.7.2

- Extended exit log

## v0.7.1

- Added additional logs

## v0.7.0

- Removed auto-payout and participation in governance filters
- Implemented charts framework for cumulative line and bar types
- Implemented Signed Extrinsic charts
- Fixed hand icon colour, when validator is selected
- Renamed 'Total issuance' to 'Total supply' on home page
- Updated validators count format on home page
- Removed 'Total transactions fees' on home page
- Added total/circulating-supply API

## v0.6.0

- Updated crawlers log levels.
- Show CERE-USD conversion rate in header.
- Downgraded @polkadot/api to 3.11.1.

## v0.5.0

- Added total transactions to homepage.
- Updated tooltip position for blocks.

## v0.4.0

- Updated logo and favicon.
- Added functionality to filter blocks based on block hash.

## v0.3.1

- Updated Cere Network Homepage link.

## v0.3.0

- Added faucet functionality.
- Added Google Analytics for PROD.
- Updated backend config values.

## v0.2.0

- Added UI to show EDP banner on homepage.

## v0.1.0

- Adapted for Cere Network.
- Added API to add and get EDP info.
