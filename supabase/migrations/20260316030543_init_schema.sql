-- Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT,
    role TEXT CHECK (role IN ('admin','user')),
    credits INTEGER DEFAULT 0,
    reliability_score INTEGER DEFAULT 100,
    is_restricted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Auctions
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    description TEXT,
    image_url TEXT,
    min_bid INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status TEXT CHECK (status IN ('upcoming','active','paused','closed')),
    created_by UUID REFERENCES profiles(id),
    winner_id UUID REFERENCES profiles(id),
    winning_bid INTEGER,
    auction_reliability FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bids
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID REFERENCES auctions(id),
    user_id UUID REFERENCES profiles(id),
    bid_amount INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);