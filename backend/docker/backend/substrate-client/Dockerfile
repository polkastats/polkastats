FROM phusion/baseimage:master-amd64
LABEL maintainer "@mariopino"
LABEL description="Parity Polkadot client"

ARG VERSION=v0.9.3

RUN apt-get update && apt-get install wget curl jq -y

WORKDIR /usr/local/bin

RUN wget https://github.com/paritytech/polkadot/releases/download/$VERSION/polkadot \
    && chmod +x polkadot

# FINAL PREPARATIONS
EXPOSE 30333 9933 9944

VOLUME ["/data"]

ENTRYPOINT ["polkadot"]
CMD ["--dev"]
