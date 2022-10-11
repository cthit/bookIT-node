FROM node:lts as build

COPY package.json package-lock.json ./
COPY ./prisma/ .
RUN npm install

COPY . .
RUN npm run build

FROM node:lts

COPY --from=build ./build ./build/
COPY --from=build ./src/schemas ./build/schemas
COPY --from=build ./prisma ./prisma/
COPY --from=build ./startup.sh ./package.json ./package-lock.json ./

RUN npm install --production

CMD sh ./startup.sh
