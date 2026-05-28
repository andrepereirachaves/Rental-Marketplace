const crypto = require("crypto");

module.exports = async function (app) {
  app.patch("/profile", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { name, phone, avatar_url } = request.body;

    const fields = [];
    const params = [];
    let idx = 1;

    if (name) { fields.push(`name = $${idx++}`); params.push(name); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); params.push(phone); }
    if (avatar_url !== undefined) { fields.push(`avatar_url = $${idx++}`); params.push(avatar_url); }

    if (fields.length === 0) {
      return reply.status(400).send({ error: "No fields to update" });
    }

    params.push(request.user.id);
    const result = await app.pg.query(
      `UPDATE users SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${idx} RETURNING id, name, email, phone, avatar_url, kyc_verified, rating, user_type`,
      params
    );

    reply.send(result.rows[0]);
  });

  app.post("/kyc", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { document } = request.body;

    if (!document) {
      return reply.status(400).send({ error: "document is required" });
    }

    const result = await app.pg.query(
      `UPDATE users SET document = $1, kyc_verified = TRUE, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, kyc_verified`,
      [document, request.user.id]
    );

    reply.send({ message: "KYC approved", user: result.rows[0] });
  });

  app.get("/:id", async (request, reply) => {
    const result = await app.pg.query(
      `SELECT id, name, email, phone, avatar_url, rating, user_type, kyc_verified
       FROM users WHERE id = $1`,
      [request.params.id]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: "User not found" });
    }

    reply.send(result.rows[0]);
  });

  app.post("/generate-qr", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { rental_id } = request.body;

    if (!rental_id) {
      return reply.status(400).send({ error: "rental_id is required" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await app.pg.query(
      `UPDATE rentals SET qr_code_token = $1 WHERE id = $2 AND (renter_id = $3 OR EXISTS (
        SELECT 1 FROM products WHERE id = rentals.product_id AND owner_id = $3
      ))`,
      [token, rental_id, request.user.id]
    );

    reply.send({ token, rental_id });
  });

  app.post("/validate-qr", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { rental_id, token } = request.body;

    if (!rental_id || !token) {
      return reply.status(400).send({ error: "rental_id and token are required" });
    }

    const result = await app.pg.query(
      `SELECT id, qr_code_token, pickup_confirmed, return_confirmed FROM rentals WHERE id = $1`,
      [rental_id]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: "Rental not found" });
    }

    const rental = result.rows[0];

    if (rental.qr_code_token !== token) {
      return reply.status(400).send({ error: "Invalid QR Code token" });
    }

    if (!rental.pickup_confirmed) {
      await app.pg.query(
        "UPDATE rentals SET pickup_confirmed = TRUE, updated_at = NOW() WHERE id = $1",
        [rental_id]
      );
      return reply.send({ message: "Pickup confirmed via QR Code", action: "pickup" });
    }

    if (!rental.return_confirmed) {
      await app.pg.query(
        "UPDATE rentals SET return_confirmed = TRUE, status = 'completed', updated_at = NOW() WHERE id = $1",
        [rental_id]
      );
      await app.pg.query(
        "UPDATE transactions SET status = 'released', updated_at = NOW() WHERE rental_id = $1",
        [rental_id]
      );
      await app.pg.query(
        `UPDATE products SET status = 'available' WHERE id = (SELECT product_id FROM rentals WHERE id = $1)`,
        [rental_id]
      );
      return reply.send({ message: "Return confirmed via QR Code. Payment released.", action: "return" });
    }

    reply.send({ message: "QR Code already used", action: "done" });
  });
};
