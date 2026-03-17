-- Place bid RPC function
create or replace function place_bid(
  p_auction_id uuid,
  p_user_id uuid,
  p_amount numeric
)
returns json
language plpgsql
as $$
declare
  current_bid record;
  user_data record;
  auction_data record;
  new_bid record;
begin
  -- Check auction status
  select * into auction_data
  from auctions
  where id = p_auction_id;

  if auction_data.status != 'active' then
    raise exception 'Auction is not active';
  end if;

  -- Get current winning bid
  select * into current_bid
  from bids
  where auction_id = p_auction_id
    and is_winning_bid = true
  limit 1;

  -- Validate bid
  if current_bid is not null and p_amount <= current_bid.amount then
    raise exception 'Bid must be higher than current highest bid';
  end if;

  -- Check credits
  select * into user_data
  from profiles
  where id = p_user_id;

  if user_data.credits < p_amount then
    raise exception 'Not enough credits';
  end if;

  -- Reset previous winning bid
  update bids
  set is_winning_bid = false
  where auction_id = p_auction_id
    and is_winning_bid = true;

  -- Insert new bid
  insert into bids (auction_id, user_id, amount, is_winning_bid)
  values (p_auction_id, p_user_id, p_amount, true)
  returning * into new_bid;

  return row_to_json(new_bid);
end;
$$;


-- Safety: ensure only one winning bid per auction
create unique index if not exists one_winning_bid_per_auction
on bids (auction_id)
where is_winning_bid = true;