FROM alpine:3.20
LABEL supercharger.workdir="/work"
RUN apk add --no-cache bash curl jq nano vim && mkdir -p /work/responses
COPY responses/ /work/responses/
COPY check /usr/local/bin/check
RUN chmod +x /usr/local/bin/check
CMD ["tail", "-f", "/dev/null"]
