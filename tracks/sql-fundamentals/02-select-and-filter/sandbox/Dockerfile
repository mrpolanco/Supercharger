FROM postgres:16-alpine
ENV POSTGRES_HOST_AUTH_METHOD=trust \
    POSTGRES_DB=support \
    PGUSER=postgres \
    PGDATABASE=support
RUN apk add --no-cache nano vim && mkdir -p /work && chmod 777 /work
COPY seed.sql /docker-entrypoint-initdb.d/seed.sql
COPY check /usr/local/bin/check
RUN chmod +x /usr/local/bin/check
