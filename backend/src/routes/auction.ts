import express from "express"
import { authenticateUser } from "../middleware/auth"
import * as auctionController from "../controllers/auctionController"
import { supabase } from "../config/supabase"

const router = express.Router()

router.get("/", auctionController.getAuctions)
router.get("/:id", auctionController.getAuction)

// Create auction
router.post("/", authenticateUser, async (req, res) => {
  const { title, description, image_url, start_time, end_time, min_bid } = req.body
  
  const { data } = await supabase
    .from("auctions")
    .insert({
      title,
      description,
      image_url,
      start_time,
      end_time,
      min_bid,
      status: "active",
      created_by: req.user!.id
    })
    .select()
    .single()
  
  res.json(data)
})

// Close auction
router.post("/:id/close", authenticateUser, async (req, res) => {
  const { id } = req.params
  
  const { data } = await supabase
    .from("auctions")
    .update({ status: "closed" })
    .eq("id", id)
    .select()
    .single()
  
  res.json(data)
})

export default router