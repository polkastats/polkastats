FROM phusion/baseimage:jammy-1.0.0
ARG POLKADOT_VERSION
LABEL maintainer "@mariopino"
LABEL description="Parity Polkadot client"
RUN apt-get update && apt-get install wget -y
WORKDIR /usr/local/bin
RUN wget https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-$POLKADOT_VERSION/polkadot \
    && chmod +x polkadot
EXPOSE 30333 9933 9944
VOLUME ["/data"]
ENTRYPOINT ["polkadot"]
