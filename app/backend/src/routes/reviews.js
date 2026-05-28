module.exports = async function (app) {
  app.post("/", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { rental_id, rating, comment } = request.body;

    if (!rental_id || !rating) {
      return reply.status(400).send({ error: "rental_id and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return reply.status(400).send({ error: "rating must be between 1 and 5" });
    }

    const rental = await app.pg.query(
      `SELECT r.*, p.owner_id FROM rentals r JOIN products p ON p.id = r.product_id WHERE r.id = $1`,
      [rental_id]
    );
    if (rental.rows.length === 0) {
      return reply.status(404).send({ error: "Rental not found" });
    }

    const r = rental.rows[0];
    if (r.status !== "completed") {
      return reply.status(400).send({ error: "Can only review completed rentals" });
    }

    const isOwner = r.owner_id === request.user.id;
    const isRenter = r.renter_id === request.user.id;
    if (!isOwner && !isRenter) {
      return reply.status(403).send({ error: "Not part of this rental" });
    }

    const reviewee_id = isOwner ? r.renter_id : r.owner_id;

    const existing = await app.pg.query(
      "SELECT id FROM reviews WHERE rental_id = $1 AND reviewer_id = $2",
      [rental_id, request.user.id]
    );
    if (existing.rows.length > 0) {
      return reply.status(409).send({ error: "You already reviewed this rental" });
    }

    const result = await app.pg.query(
      `INSERT INTO reviews (rental_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [rental_id, request.user.id, reviewee_id, rating, comment || null]
    );

    await app.pg.query(
      `UPDATE users SET rating = (
         SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE reviewee_id = $1
       ) WHERE id = $1`,
      [reviewee_id]
    );

    reply.status(201).send(result.rows[0]);
  });

  app.get("/user/:userId", async (request, reply) => {
    const result = await app.pg.query(
      `SELECT r.*, u.name AS reviewer_name, p.title AS product_title
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       JOIN rentals rl ON rl.id = r.rental_id
       JOIN products p ON p.id = rl.product_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [request.params.userId]
    );
    reply.send(result.rows);
  });

  app.get("/pending", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = await app.pg.query(
      `SELECT r.id AS rental_id, rl.id, rl.product_id, p.title AS product_title,
              u.id AS other_id, u.name AS other_name,
              CASE WHEN rl.renter_id = $1 THEN 'renter' ELSE 'owner' END AS role
       FROM rentals rl
       JOIN products p ON p.id = rl.product_id
       JOIN users u ON u.id = CASE WHEN rl.renter_id = $1 THEN p.owner_id ELSE rl.renter_id END
       LEFT JOIN reviews r ON r.rental_id = rl.id AND r.reviewer_id = $1
       WHERE rl.status = 'completed' AND r.id IS NULL
       AND (rl.renter_id = $1 OR p.owner_id = $1)`,
      [request.user.id]
    );
    reply.send(result.rows);
  });
};
