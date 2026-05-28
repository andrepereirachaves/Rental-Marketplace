const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Fastify = require("fastify");
const app = Fastify({ logger: true });

app.register(require("@fastify/cors"), { origin: "*" });
app.register(require("@fastify/postgres"), {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

app.register(require("@fastify/redis"), {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

app.register(require("@fastify/jwt"), { secret: process.env.JWT_SECRET });

app.decorate("authenticate", async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized" });
  }
});

app.register(require("./routes/auth"), { prefix: "/api/auth" });
app.register(require("./routes/products"), { prefix: "/api/products" });
app.register(require("./routes/rentals"), { prefix: "/api/rentals" });
app.register(require("./routes/reviews"), { prefix: "/api/reviews" });
app.register(require("./routes/users"), { prefix: "/api/users" });

app.get("/docs", async (request, reply) => {
  const html = fs.readFileSync(path.join(__dirname, "docs.html"), "utf-8");
  reply.type("text/html").send(html);
});

const start = async () => {
  try {
    await app.listen({ port: process.env.API_PORT || 3000, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
