FROM node:fermium

WORKDIR /usr/app/crawler

COPY ./crawler /usr/app/crawler
COPY ./db /usr/app/db

RUN yarn 

CMD ["yarn", "start"]
