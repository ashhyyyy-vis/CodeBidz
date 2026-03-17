import { supabase } from "../config/supabase"
import * as creditService from "./creditService"

export async function getActiveAuctions() {
  const { data } = await supabase
    .from("auctions")
    .select("*")
    .eq("status", "active")

  return data
}

export async function getInactiveAuctions() {
  const { data } = await supabase
    .from("auctions")
    .select("*")
    .eq("status", "closed")

  return data
}

export async function getAllAuctions() {
  const { data } = await supabase
    .from("auctions")
    .select("*")
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
  const { data, error } = await supabase.rpc('place_bid', {
    p_auction_id: auctionId,
    p_user_id: userId,
    p_amount: amount
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function completeAuction(auctionId: string) {
  // Get the winning bid
  const { data: winningBid } = await supabase
    .from("bids")
    .select("*")
    .eq("auction_id", auctionId)
    .eq("is_winning_bid", true)
    .single()

  if (!winningBid) return null

  // Update auction status and winner
  await supabase
    .from("auctions")
    .update({
      status: "closed",
      winner_id: winningBid.user_id,
      winning_bid: winningBid.amount
    })
    .eq("id", auctionId)

  // Deduct credits from winner
  await creditService.deductCredits(winningBid.user_id, winningBid.amount)

  return winningBid
}