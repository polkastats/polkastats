FROM phusion/baseimage:0.11
LABEL maintainer "@mariopino"
LABEL description="Parity Polkadot client"
ARG VERSION = ${VERSION}
RUN apt-get update && apt-get install wget curl jq -y
WORKDIR /usr/local/bin
RUN wget https://github.com/paritytech/polkadot/releases/download/$VERSION/polkadot \
    && chmod +x polkadot
EXPOSE 30333 9933 9944
VOLUME ["/data"]
ENTRYPOINT ["polkadot"]
