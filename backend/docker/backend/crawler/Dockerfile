FROM node:16.3.0-alpine3.12

WORKDIR /usr/app/crawler

COPY . /usr/app/crawler

RUN apk update && apk add yarn python g++ make libpq-dev && rm -rf /var/cache/apk/*

RUN yarn 

CMD ["yarn", "start"]
