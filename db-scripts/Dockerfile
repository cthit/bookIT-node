
FROM jobber

USER root
WORKDIR /home/jobberuser

RUN apk update
RUN apk add vim postgresql-client

COPY .jobber ./
RUN chmod 744 .jobber
COPY delete-data.sql ./

ENV PGPASSWORD=password
ENV DB_USER=postgres
ENV DB_HOST=db
ENV DB_PORT=5432
ENV DB_NAME=bookit
