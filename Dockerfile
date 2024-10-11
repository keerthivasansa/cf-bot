FROM oven/bun AS base

COPY . .

RUN apt update && apt install fonts-liberation2

RUN bun install

CMD [ "bun", "start" ]
