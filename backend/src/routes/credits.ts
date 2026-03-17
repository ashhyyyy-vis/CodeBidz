import express from "express"
import { authenticateUser } from "../middleware/auth"
import { supabase } from "../config/supabase"

const router = express.Router()

router.post("/add-credits", authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id
    
    // Get current credits
    const { data: current } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single()
    
    // Add 1000 credits
    const { data } = await supabase
      .from("profiles")
      .update({ credits: (current?.credits || 0) + 1000 })
      .eq("id", userId)
      .select()
      .single()
    
    res.json({ message: "Added 1000 credits", credits: data?.credits })
  } catch (err) {
    res.status(500).json({ error: "Failed to add credits" })
  }
})

export default router
