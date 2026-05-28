const bcrypt = require("bcryptjs");

module.exports = async function (app) {
  app.post("/register", async (request, reply) => {
    const { name, email, password, phone } = request.body;

    if (!name || !email || !password) {
      return reply.status(400).send({ error: "name, email and password are required" });
    }

    const existing = await app.pg.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await app.pg.query(
      `INSERT INTO users (name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email`,
      [name, email, password_hash, phone || null]
    );

    const user = result.rows[0];
    const token = app.jwt.sign({ id: user.id, email: user.email });

    reply.status(201).send({ user, token });
  });

  app.post("/login", async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: "email and password are required" });
    }

    const result = await app.pg.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const token = app.jwt.sign({ id: user.id, email: user.email });

    reply.send({ user: { id: user.id, name: user.name, email: user.email }, token });
  });

  app.get("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = await app.pg.query(
      `SELECT id, name, email, phone, document, kyc_verified, avatar_url, rating, user_type
       FROM users WHERE id = $1`,
      [request.user.id]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: "User not found" });
    }

    reply.send(result.rows[0]);
  });
};
