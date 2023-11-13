[![Build Status](https://jenkins.cassbana.com/buildStatus/icon?job=project-x%2Fproject-x-communication%2Fdevelop&subject=backend%20status)](https://jenkins.cassbana.com/job/project-x/job/project-x-backend/job/develop/)

# Welcome to Communication Service!

Communication service is used to send SMS and emails. Currently we support only sending sms via Infobip


## Installation Pre-Requisites

For the project to run locally you need to have following installations

1. Docker (https://docs.docker.com/engine/install/)
2. Docker Compose (https://docs.docker.com/compose/install/)
3. Mongo (https://docs.mongodb.com/manual/installation/)
4. RabbitMQ (https://www.rabbitmq.com/download.html)
5. NodeJS (https://nodejs.org/en/download/)
6. NPM (Gets install with NodeJS)

## Login to NPM
First cause @cassbana packages are private, you need to authorize npm to this namespace.
just create .npmrc file with the following content and replace YOUR_GITHUB_ACCESS_TOKEN

    @cassbana:registry=https://npm.pkg.github.com
    //npm.pkg.github.com/:_authToken=YOUR_GITHUB_ACCESS_TOKEN

## Build Project

    npm install

## Build and Run Project with Docker

### Windows

    bootstrap.bat

### Unix

    bootstrap.sh

## Environment Variables

Following environment variables are required to be set if running locally

### Communication
You can also find the environment file at (./apps/communication/.local.env)

    PORT=8080
    HOST=localhost
    MONGO_HOST=mongodb://localhost:27017/comm
    MONGO_PORT=27017
    RABBITMQ_URL=amqp://localhost
    SMS_PROVIDER_AUTH_TYPE=apiKey
    SMS_PROVIDER_BASE_HOST=api.infobip.com
    SMS_PROVIDER_API_KEY=
    SMS_PROVIDER_SENDER_ID=Cassbana
    RABBITMQ_SMS_EXCHANGE=ex.sms
    RABBITMQ_SMS_FAILURE_EXCHANGE=ex.sms.failure
    RABBITMQ_SMS_FAILURE_EXCHANGE_ROUTING=error
    RABBITMQ_CEQUENS_EXCHANGE=ex.cequens
    RABBITMQ_INFOBIP_EXCHANGE=ex.infobip
    RABBITMQ_SMS_EXCHANGE_ROUTING=sms
    RABBITMQ_QUEUE_INFOBIP_P1=qu.infobip.p1
    RABBITMQ_QUEUE_INFOBIP_P2=qu.infobip.p2
    RABBITMQ_QUEUE_CEQUENS_P2=qu.cequens.p2
    RABBITMQ_QUEUE_CEQUENS_P1=qu.cequens.p1

    SMS_CEQUENS_BASE_HOST=apis.cequens.com
    SMS_CEQUENS_API_KEY=
    SMS_CEQUENS_USER_NAME=Cassbana

# Run Services Locally without Docker

    npm run start:dev

## Exchange Setup for communication!
```mermaid
graph TD;
A[ex.message] -- sms --> B[ex.sms];
A -- email --> C[ex.email];
C --> D[(qu.email)];
B -- country: other --> E[ex.infobip];
B -- country: egypt --> F[ex.cequens];
E --> G[(qu.infobip.*)];
F --> H[(qu.cequens.*)];
```

![](exhange-setup.png)