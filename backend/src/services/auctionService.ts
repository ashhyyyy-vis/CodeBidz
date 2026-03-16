import { supabase } from "../config/supabase"

export async function getAllAuctions() {
  const { data } = await supabase
    .from("auctions")
    .select("*")
    .eq("status", "active")

  return data
}

export async function getAuctionById(id: string) {
  const { data } = await supabase
    .from("auctions")
    .select("*")
    .eq("id", id)
    .single()

  return data
}

export async function createAuction(auctionData: any) {
  const { data } = await supabase
    .from("auctions")
    .insert(auctionData)
    .select()
    .single()

  return data
}

export async function placeBid(
  auctionId: string,
  userId: string,
  amount: number
) {
  const { data } = await supabase
    .from("bids")
    .insert({
      auction_id: auctionId,
      user_id: userId,
      amount
    })
    .select()
    .single()

  return data
}