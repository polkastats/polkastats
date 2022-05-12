FROM node:fermium

WORKDIR /usr/app/api

COPY ./api /usr/app/api
COPY ./db /usr/app/db

EXPOSE 8000

RUN yarn 

CMD ["yarn", "start"]
