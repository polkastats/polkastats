#!/bin/bash
docker stop backend_crawler_1
docker stop backend_postgres_1
docker stop backend_graphql-engine_1

docker rm backend_api_1
docker rm backend_crawler_1
docker rm backend_postgres_1
docker rm backend_graphql-engine_1

docker rmi crawler:latest

docker volume rm backend_db-data

