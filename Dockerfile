FROM node:16.0.0-alpine
WORKDIR /opt/communication
COPY . .
RUN npm config set fetch-retry-maxtimeout 300000
RUN npm install
CMD npm run start:dev