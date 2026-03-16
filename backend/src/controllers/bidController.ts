import { Request, Response } from "express"
import * as auctionService from "../services/auctionService"
import * as creditService from "../services/creditService"

export async function placeBid(req: Request, res: Response) {
  const userId = req.user!.id
  const { auctionId, amount } = req.body

  const auction = await auctionService.getAuctionById(auctionId)

  if (!auction) {
    return res.status(404).json({ error: "Auction not found" })
  }

  const hasCredits = await creditService.checkCredits(userId, amount)

  if (!hasCredits) {
    return res.status(400).json({ error: "Insufficient credits" })
  }

  await creditService.deductCredits(userId, amount)

  const bid = await auctionService.placeBid(auctionId, userId, amount)

  res.json(bid)
}