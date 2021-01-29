# PolkaStats Next Gen

## Install

Install mono-repo:

```
git clone https://github.com/Colm3na/polkastats-ng.git
cd polkastats-ng
yarn
```

### Frontend

You will need `nodejs`:

```
yarn workspace frontend dev
```

That will start a dev frontend with hot reload. 

### Backend

You will need `nodejs`, `docker` and `docker-compose`:

```
yarn workspace backend docker
```

That will build and start all the required dockers automagically:

- PostgreSQL
- Hasura GraphQL server
- Parity Polkadot client
- Nodejs crawler
