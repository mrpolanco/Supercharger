FROM python:3.12-alpine
LABEL supercharger.workdir="/work"
RUN apk add --no-cache bash curl jq nano vim && mkdir -p /work /srv
COPY api.py /srv/api.py
COPY customer-payload.json /work/customer-payload.json
COPY check /usr/local/bin/check
RUN chmod +x /usr/local/bin/check
CMD ["sh", "-c", "python3 /srv/api.py >/tmp/api.log 2>&1 & tail -f /dev/null"]
