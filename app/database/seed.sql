INSERT INTO users (id, name, email, password_hash, phone, user_type, kyc_verified, rating)
VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'João Silva', 'joao@email.com', '$2b$10$placeholder', '(11) 99999-0001', 'both', TRUE, 4.8),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Maria Souza', 'maria@email.com', '$2b$10$placeholder', '(11) 99999-0002', 'owner', TRUE, 4.5),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Carlos Lima', 'carlos@email.com', '$2b$10$placeholder', '(11) 99999-0003', 'renter', FALSE, 0);

INSERT INTO products (id, owner_id, title, description, category, price_per_day, deposit_amount, images, city, state, latitude, longitude)
VALUES
    ('d4e5f6a7-b8c9-0123-defa-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Furadeira de Impacto Bosch 650W', 'Furadeira profissional, ótimo estado, acompanha maleta e brocas', 'Ferramentas', 35.00, 150.00, ARRAY['https://via.placeholder.com/400'], 'São Paulo', 'SP', -23.5505, -46.6333),
    ('e5f6a7b8-c9d0-1234-efab-345678901234', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Drone DJI Mini 3 Pro', 'Drone com câmera 4K, bateria extra e controle remoto', 'Eletrônicos', 120.00, 2000.00, ARRAY['https://via.placeholder.com/400'], 'São Paulo', 'SP', -23.5610, -46.6560),
    ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Caixa de Som JBL PartyBox 310', 'Caixa de som portátil para festas, 240W, Bluetooth', 'Festa', 80.00, 500.00, ARRAY['https://via.placeholder.com/400'], 'São Paulo', 'SP', -23.5470, -46.6420);

INSERT INTO product_availability (product_id, date, available)
SELECT id, generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')::date, TRUE
FROM products;
