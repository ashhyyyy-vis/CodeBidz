import { Request, Response } from "express"
import * as auctionService from "../services/auctionService"

export async function getAllAuctions(req: Request, res: Response) {
  const auctions = await auctionService.getAllAuctions()
  res.json(auctions)
}

export async function getAuction(req: Request, res: Response) {
  const { id } = req.params
  
  // Handle both string and string[] cases
  const auctionId = Array.isArray(id) ? id[0] : id
  
  const auction = await auctionService.getAuctionById(auctionId)

  if (!auction) {
    return res.status(404).json({ error: "Auction not found" })
  }

  res.json(auction)
}

export async function createAuction(req: Request, res: Response) {
  const auction = await auctionService.createAuction(req.body)
  res.json(auction)
}