
FROM phusion/baseimage:0.11
LABEL maintainer "@mariopino"
LABEL description="Parity Polkadot client"
RUN apt-get update && apt-get install wget curl jq -y
WORKDIR /usr/local/bin
RUN wget https://github.com/paritytech/polkadot/releases/download/$POLKADOT_VERSION/polkadot \
    && chmod +x polkadot
EXPOSE 30333 9933 9944
VOLUME ["/data"]
ENTRYPOINT ["polkadot"]
