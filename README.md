# Cerestats

Cerestats is a block explorer for [Cere Network](https://cere.network/).

Check it out live versions at [Cerestats](https://stats.cere.network/)

## Dependencies

In Ubuntu 20.04 server you can do:

```bash
apt update
apt upgrade
apt install libpq5=12.9-0ubuntu0.20.04.1
apt install git build-essential apt-transport-https ca-certificates curl software-properties-common libpq-dev
```

In macOS, you can do:
```bash
brew install postgresql libpq
export PATH="/opt/homebrew/opt/libpq/bin:$PATH" 
```

# docker
```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
apt update
apt install docker-ce
```

# docker-compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```
# node v14
```bash
curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
bash nodesource_setup.sh
apt install nodejs
```

# yarn
```bash
npm install --global yarn
```

## Install

Install mono-repo:

```bash
git clone https://github.com/Cerebellum-Network/cerestats.git
cd cerestats
yarn
```

### Backend

Before build dockers be sure to edit `HASURA_GRAPHQL_ADMIN_SECRET` environmment variable in the proper docker-compose file `backend/docker/docker-compose-cere-mainnet.yml`.

Cere Network:

```bash
yarn workspace backend docker:cere:mainnet
```

If you are experiencing a database doesn't exist error then clean docker volumes:

```bash
docker volume prune
```



That will build and start all the required dockers:

- PostgreSQL
- Hasura GraphQL server
- Nodejs crawler
- Nodejs API

Crawlers healthchecks API is available via `GET/health` request.


### Hasura configuration

After that you need to access to Hasura console at http://localhost:8082 and:

- Login as admin using the password you previously set in `HASURA_GRAPHQL_ADMIN_SECRET`
- Track all tables
- For all tables go to Permissions and:
  - Add a new ROLE named 'public' with SELECT permissions.
  - Enable aggregate permissions.


### Frontend

Start a dev frontend with hot reload at http://localhost:3000

```bash
yarn workspace frontend dev
```

Generate a static build under `frontend/dist` directory:

```bash
yarn workspace frontend generate
```

### Database migrations

[db-migrate](https://github.com/db-migrate/node-db-migrate) tool used to apply data migrations. More details you can find here: https://db-migrate.readthedocs.io/en/latest/

#### Install
```bash
npm install -g db-migrate
```

#### Create migration
```bash
yarn workspace backend db:migrate:create MIGRATION_NAME
```

In `*-up.sql` should be database updates you want to apply (via `db-migrate up` command) and in `*-down.sql` should be updates rollback that can be executed in case migration is incorrect (via `db-migrate down` command)

<strong>Note</strong>: *-down.sql is required.

All migrations must be listed in changelog and include description about compatibility with previous version of the code. Example:
```
Added migration #1 (compatible with the previous code version)
```
or
```
Added migration #1 (incompatible with the previous code version)
```

#### Apply migrations
```bash
yarn workspace backend db:migrate:up -e ENV
```

#### Rollback migrations
```bash
yarn workspace backend db:migrate:down -e ENV
```
