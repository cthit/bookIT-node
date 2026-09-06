
FROM postgres:12.22-alpine
WORKDIR /cleanup
COPY delete-data.sql ./
COPY cleanup.sh ./
USER postgres
ENV DB_USER=postgres
ENV DB_HOST=db
ENV DB_PORT=5432
ENV DB_NAME=bookit
ENTRYPOINT ["sh", "/cleanup/cleanup.sh"]
