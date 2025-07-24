FROM oven/bun:1.1.42

WORKDIR /app

COPY package.json bun.lockb ./

RUN apt-get update && apt-get install -y unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "run", "start"]
