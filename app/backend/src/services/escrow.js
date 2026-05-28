class EscrowService {
  constructor(app) {
    this.app = app;
  }

  async holdPayment(rentalId, amount, deposit) {
    const platformFee = amount * 0.15;
    const result = await this.app.pg.query(
      `INSERT INTO transactions (rental_id, amount, deposit_amount, platform_fee, status)
       VALUES ($1, $2, $3, $4, 'held') RETURNING *`,
      [rentalId, amount, deposit, platformFee]
    );
    return result.rows[0];
  }

  async releasePayment(rentalId) {
    const result = await this.app.pg.query(
      `UPDATE transactions SET status = 'released', updated_at = NOW()
       WHERE rental_id = $1 AND status = 'held' RETURNING *`,
      [rentalId]
    );
    return result.rows[0];
  }

  async refundDeposit(rentalId) {
    const result = await this.app.pg.query(
      `UPDATE transactions SET status = 'refunded', updated_at = NOW()
       WHERE rental_id = $1 AND status = 'held' RETURNING *`,
      [rentalId]
    );
    return result.rows[0];
  }
}

module.exports = EscrowService;
