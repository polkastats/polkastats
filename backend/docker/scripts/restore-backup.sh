#!/bin/bash

cd ~/backup

if [ ! -f substrate-data.tar ]; then
    echo "File not found!"
    echo "Abort"
    exit 1
fi

# Stop all cointainers
docker stop backend_crawler_1
docker stop backend_graphql-engine_1
docker stop backend_postgres_1
docker stop backend_substrate-node_1
sleep 5

if [ $(docker inspect -f '{{.State.Running}}' backend_substrate-node_1) = "true" ]; then 
    echo "Substrate node still running"
    exit 1
else 
    echo "Substrate node stopped"
    echo "Starting the restoration"
fi

## Restore
docker run --rm --volumes-from backend_substrate-node_1 -v $(pwd):/backup ubuntu bash -c "cd /data && tar xvf /backup/substrate-data.tar --strip 1"

echo ""
echo "Restoring backup finished, starting dockers"
echo ""

sleep 5
docker start backend_substrate-node_1
docker start backend_postgres_1
docker start backend_graphql-engine_1
docker start backend_crawler_1


