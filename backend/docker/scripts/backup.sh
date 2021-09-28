#!/bin/bash

mkdir -p ~/backup
cd ~/backup

# Stop all cointainers
docker stop backend_api_1
docker stop backend_crawler_1
docker stop backend_postgres_1
docker stop backend_graphql-engine_1
docker stop backend_substrate-node_1
sleep 5

if [ $(docker inspect -f '{{.State.Running}}' backend_substrate-node_1) = "true" ]; then
    echo "Substrate node still running"
    exit 1
else
    echo "Substrate node stopped"
    echo "Starting the backup"
fi

docker run --rm --volumes-from backend_substrate-node_1 -v $(pwd):/backup ubuntu tar cvf /backup/substrate-data.tar /data

echo ""
echo "Backup finished, starting dockers"
echo ""

sleep 5
docker start backend_substrate-node_1
docker start backend_postgres_1
docker start backend_graphql-engine_1
docker start backend_crawler_1
docker start backend_api_1
