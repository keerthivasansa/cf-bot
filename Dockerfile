FROM oven/bun AS base

COPY . .

RUN bun install

CMD [ "bun", "start" ]
