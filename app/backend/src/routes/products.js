module.exports = async function (app) {
  app.get("/", async (request, reply) => {
    const { search, category, min_price, max_price, city, lat, lng, radius_km } = request.query;

    let query = `
      SELECT p.*, u.name AS owner_name, u.avatar_url AS owner_avatar,
        (SELECT COUNT(*) FROM reviews r JOIN rentals rl ON r.rental_id = rl.id WHERE rl.product_id = p.id) AS review_count
      FROM products p
      JOIN users u ON u.id = p.owner_id
      WHERE p.status = 'available'
    `;
    const params = [];
    let idx = 1;

    if (search) {
      query += ` AND p.search_vector @@ plainto_tsquery('portuguese', $${idx})`;
      params.push(search);
      idx++;
    }
    if (category) {
      query += ` AND p.category = $${idx}`;
      params.push(category);
      idx++;
    }
    if (min_price) {
      query += ` AND p.price_per_day >= $${idx}`;
      params.push(parseFloat(min_price));
      idx++;
    }
    if (max_price) {
      query += ` AND p.price_per_day <= $${idx}`;
      params.push(parseFloat(max_price));
      idx++;
    }
    if (city) {
      query += ` AND LOWER(p.city) LIKE $${idx}`;
      params.push(`%${city.toLowerCase()}%`);
      idx++;
    }

    query += " ORDER BY p.created_at DESC";

    const result = await app.pg.query(query, params);
    reply.send(result.rows);
  });

  app.get("/:id", async (request, reply) => {
    const result = await app.pg.query(
      `SELECT p.*, u.name AS owner_name, u.avatar_url AS owner_avatar, u.rating AS owner_rating
       FROM products p JOIN users u ON u.id = p.owner_id WHERE p.id = $1`,
      [request.params.id]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: "Product not found" });
    }

    reply.send(result.rows[0]);
  });

  app.post("/", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { title, description, category, price_per_day, deposit_amount, images, latitude, longitude, city, state } = request.body;

    if (!title || !category || !price_per_day) {
      return reply.status(400).send({ error: "title, category and price_per_day are required" });
    }

    const result = await app.pg.query(
      `INSERT INTO products (owner_id, title, description, category, price_per_day, deposit_amount, images, latitude, longitude, city, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [request.user.id, title, description, category, price_per_day, deposit_amount || 0, images || [], latitude || null, longitude || null, city || null, state || null]
    );

    reply.status(201).send(result.rows[0]);
  });

  app.get("/categories/list", async (request, reply) => {
    const result = await app.pg.query(
      "SELECT DISTINCT category FROM products WHERE status = 'available' ORDER BY category"
    );
    reply.send(result.rows.map((r) => r.category));
  });
};
