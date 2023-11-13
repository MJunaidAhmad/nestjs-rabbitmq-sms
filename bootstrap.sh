#!/bin/bash
echo '================create network====================='
docker network create projectx_network
echo '===============run docker-compose=================='
docker-compose up -d --build
echo '===============build docker images================='
docker build . -f Dockerfile -t communication
echo '===============run docker containers==============='
docker run -d --name communication --network projectx_network --env-file .local.env communication
