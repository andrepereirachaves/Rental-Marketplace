CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE user_type AS ENUM ('owner', 'renter', 'both');
CREATE TYPE rental_status AS ENUM ('active', 'completed', 'disputed', 'cancelled');
CREATE TYPE transaction_status AS ENUM ('held', 'released', 'refunded', 'disputed');
CREATE TYPE product_status AS ENUM ('available', 'rented', 'unavailable');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    document VARCHAR(20),
    user_type user_type DEFAULT 'both',
    kyc_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price_per_day DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status product_status DEFAULT 'available',
    images TEXT[] DEFAULT '{}',
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    city VARCHAR(100),
    state VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_owner ON products(owner_id);
CREATE INDEX idx_products_status ON products(status);

ALTER TABLE products ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;

CREATE INDEX idx_products_search ON products USING GIN(search_vector);

CREATE TABLE rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    renter_id UUID NOT NULL REFERENCES users(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status rental_status DEFAULT 'active',
    qr_code_token VARCHAR(255),
    pickup_confirmed BOOLEAN DEFAULT FALSE,
    return_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rentals_product ON rentals(product_id);
CREATE INDEX idx_rentals_renter ON rentals(renter_id);
CREATE INDEX idx_rentals_dates ON rentals(start_date, end_date);
CREATE INDEX idx_rentals_status ON rentals(status);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL REFERENCES rentals(id),
    amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    status transaction_status DEFAULT 'held',
    stripe_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL REFERENCES rentals(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);

CREATE TABLE product_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    date DATE NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    UNIQUE(product_id, date)
);

CREATE INDEX idx_availability_product_date ON product_availability(product_id, date);
