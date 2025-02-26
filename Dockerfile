FROM oven/bun:canary

WORKDIR /app

COPY package.json bun.lockb ./


RUN apt-get update && apt-get install -y unzip

RUN bun upgrade --canary

RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "run", "start"]
