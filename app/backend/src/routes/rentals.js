module.exports = async function (app) {
  app.get("/", async (request, reply) => {
    const result = await app.pg.query(
      `SELECT r.*, p.title AS product_title, p.price_per_day,
              u.name AS renter_name
       FROM rentals r
       JOIN products p ON p.id = r.product_id
       JOIN users u ON u.id = r.renter_id
       ORDER BY r.created_at DESC`
    );
    reply.send(result.rows);
  });

  app.get("/my", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = await app.pg.query(
      `SELECT r.*, p.title AS product_title, p.price_per_day, p.images,
              u.name AS other_party_name
       FROM rentals r
       JOIN products p ON p.id = r.product_id
       JOIN users u ON u.id = CASE WHEN r.renter_id = $1 THEN p.owner_id ELSE r.renter_id END
       WHERE r.renter_id = $1 OR p.owner_id = $1
       ORDER BY r.created_at DESC`,
      [request.user.id]
    );
    reply.send(result.rows);
  });

  app.post("/", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { product_id, start_date, end_date } = request.body;

    if (!product_id || !start_date || !end_date) {
      return reply.status(400).send({ error: "product_id, start_date and end_date are required" });
    }

    const product = await app.pg.query(
      "SELECT * FROM products WHERE id = $1 AND status = 'available'",
      [product_id]
    );
    if (product.rows.length === 0) {
      return reply.status(404).send({ error: "Product not available" });
    }

    if (product.rows[0].owner_id === request.user.id) {
      return reply.status(400).send({ error: "You cannot rent your own product" });
    }

    const lock_key = `lock:product:${product_id}`;
    const locked = await app.redis.set(lock_key, request.user.id, "EX", 900, "NX");
    if (!locked) {
      return reply.status(409).send({ error: "Product is being reserved by another user" });
    }

    try {
      const overlap = await app.pg.query(
        `SELECT id FROM rentals
         WHERE product_id = $1 AND status IN ('active', 'completed')
         AND (start_date, end_date) OVERLAPS ($2::date, $3::date)`,
        [product_id, start_date, end_date]
      );

      if (overlap.rows.length > 0) {
        return reply.status(409).send({ error: "Product already rented for this period" });
      }

      const days = (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24) + 1;
      const total_price = days * parseFloat(product.rows[0].price_per_day);
      const deposit = parseFloat(product.rows[0].deposit_amount);

      const rental = await app.pg.query(
        `INSERT INTO rentals (product_id, renter_id, start_date, end_date, total_price)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [product_id, request.user.id, start_date, end_date, total_price]
      );

      await app.pg.query(
        `INSERT INTO transactions (rental_id, amount, deposit_amount, platform_fee, status)
         VALUES ($1, $2, $3, $4, 'held')`,
        [rental.rows[0].id, total_price, deposit, total_price * 0.15]
      );

      await app.pg.query(
        "UPDATE products SET status = 'rented' WHERE id = $1",
        [product_id]
      );

      reply.status(201).send({
        rental: rental.rows[0],
        message: "Payment held in escrow. Confirm pickup to release to owner.",
      });
    } finally {
      await app.redis.del(lock_key);
    }
  });

  app.patch("/:id/pickup", { preHandler: [app.authenticate] }, async (request, reply) => {
    const rental = await app.pg.query(
      `SELECT r.*, p.owner_id FROM rentals r JOIN products p ON p.id = r.product_id WHERE r.id = $1`,
      [request.params.id]
    );

    if (rental.rows.length === 0) {
      return reply.status(404).send({ error: "Rental not found" });
    }

    const r = rental.rows[0];
    if (r.status !== "active" || r.pickup_confirmed) {
      return reply.status(400).send({ error: "Invalid pickup state" });
    }

    await app.pg.query(
      "UPDATE rentals SET pickup_confirmed = TRUE, updated_at = NOW() WHERE id = $1",
      [request.params.id]
    );

    reply.send({ message: "Pickup confirmed" });
  });

  app.patch("/:id/return", { preHandler: [app.authenticate] }, async (request, reply) => {
    const rental = await app.pg.query(
      `SELECT r.*, p.owner_id FROM rentals r JOIN products p ON p.id = r.product_id WHERE r.id = $1`,
      [request.params.id]
    );

    if (rental.rows.length === 0) {
      return reply.status(404).send({ error: "Rental not found" });
    }

    const r = rental.rows[0];
    if (!r.pickup_confirmed || r.return_confirmed) {
      return reply.status(400).send({ error: "Invalid return state" });
    }

    await app.pg.query(
      "UPDATE rentals SET return_confirmed = TRUE, status = 'completed', updated_at = NOW() WHERE id = $1",
      [request.params.id]
    );

    await app.pg.query(
      "UPDATE transactions SET status = 'released', updated_at = NOW() WHERE rental_id = $1",
      [request.params.id]
    );

    await app.pg.query(
      "UPDATE products SET status = 'available' WHERE id = $1",
      [r.product_id]
    );

    reply.send({ message: "Return confirmed. Payment released to owner." });
  });

  app.post("/:id/confirm", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { token } = request.body;
    const result = await app.pg.query(
      "UPDATE rentals SET qr_code_token = $1 WHERE id = $2 AND (pickup_confirmed = FALSE OR return_confirmed = FALSE) RETURNING *",
      [token, request.params.id]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: "Rental not found or already confirmed" });
    }

    reply.send({ message: "QR token registered" });
  });
};
