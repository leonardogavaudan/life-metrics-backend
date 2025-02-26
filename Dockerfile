FROM oven/bun:canary

WORKDIR /app

COPY package.json bun.lockb ./

RUN bun install

RUN bun upgrade --canary

COPY . .

EXPOSE 3000

CMD ["bun", "run", "start"]
