FROM node:fermium

WORKDIR /usr/app/crawler

COPY ./backend /usr/app/crawler
COPY ./db /usr/app/db

RUN yarn 

CMD ["yarn", "start"]
