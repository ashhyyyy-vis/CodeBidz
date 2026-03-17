-- Add is_winning_bid column to bids table
ALTER TABLE bids 
ADD COLUMN is_winning_bid BOOLEAN DEFAULT FALSE;
