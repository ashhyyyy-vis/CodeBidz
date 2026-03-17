import express from "express"
import { authenticateUser } from "../middleware/auth"
import { supabase } from "../config/supabase"
import * as auctionController from "../controllers/auctionController"

const router = express.Router()

// Get all users
router.get("/users", authenticateUser, async (req, res) => {
  const { data } = await supabase
    .from("profiles")
    .select("id, username, role, credits")
    .order("created_at", { ascending: false })
  
  res.json(data)
})

// Assign credits to user
router.post("/users/:id/credits", authenticateUser, async (req, res) => {
  const { id } = req.params
  const { amount } = req.body
  
  // Get current credits first
  const { data: current } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", id)
    .single()
  
  // Update with new total
  const { data } = await supabase
    .from("profiles")
    .update({ credits: (current?.credits || 0) + amount })
    .eq("id", id)
    .select()
    .single()
  
  res.json(data)
})

// Get all bids with user info
router.get("/bids", authenticateUser, async (req, res) => {
  const { data } = await supabase
    .from("bids")
    .select(`
      *,
      auction:auctions(title),
      user:profiles(username)
    `)
    .order("created_at", { ascending: false })
  
  res.json(data)
})

// Close auction
router.post("/auctions/:id/close", authenticateUser, async (req, res) => {
  const { id } = req.params
  
  const { data } = await supabase
    .from("auctions")
    .update({ status: "closed" })
    .eq("id", id)
    .select()
    .single()
  
  res.json(data)
})

// Generate mock data
router.post("/mock-data", authenticateUser, async (req, res) => {
  // Create mock users
  const mockUsers = [
    { username: "alice", role: "bidder", credits: 500 },
    { username: "bob", role: "bidder", credits: 300 },
    { username: "charlie", role: "admin", credits: 1000 }
  ]
  
  for (const user of mockUsers) {
    await supabase.auth.signUp({
      email: `${user.username}@mock.com`,
      password: "password123"
    })
  }
  
  res.json({ message: "Mock data generated" })
})

// Create auction
router.post("/auction", authenticateUser, auctionController.createAuction)

export default router