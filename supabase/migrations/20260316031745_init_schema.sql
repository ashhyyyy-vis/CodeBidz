CREATE INDEX idx_bids_auction_id ON bids(auction_id);
CREATE INDEX idx_bids_user_id ON bids(user_id);
CREATE INDEX idx_bids_amount ON bids(bid_amount);

ALTER TABLE bids
ADD CONSTRAINT positive_bid CHECK (bid_amount > 0);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID REFERENCES auctions(id),
    reported_user UUID REFERENCES profiles(id),
    reported_by UUID REFERENCES profiles(id),
    reason TEXT,
    status TEXT CHECK (status IN ('pending','resolved','dismissed')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE auction_analytics (
    auction_id UUID PRIMARY KEY REFERENCES auctions(id),
    total_bids INTEGER DEFAULT 0,
    highest_bid INTEGER DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    amount INTEGER,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);