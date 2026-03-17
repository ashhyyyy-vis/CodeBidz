import { Request, Response } from "express"
import * as auctionService from "../services/auctionService"

export async function getAuctions(req: Request, res: Response) {
  
  const { filter } = req.query

  if(filter==="all"){
    const auctions= await auctionService.getAllAuctions();
    res.json(auctions)
    return;
  }
  else if(filter==="open"){
    const auctions= await auctionService.getActiveAuctions();
    res.json(auctions)
    return;
  }
  else if(filter=="closed"){
    const auctions= await auctionService.getInactiveAuctions();
    res.json(auctions)
    return;
  }
  else{
    const auctions="Invalid filter";
    res.json(auctions)
    return;
  }

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