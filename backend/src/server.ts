import express from "express"
import cors from "cors"
import dotenv from "dotenv"

// Load environment variables FIRST
dotenv.config()

import  auctionRoutes from "./routes/auction"
import  bidRoutes  from "./routes/bids"
import  adminRoutes  from "./routes/admin"
import  authRoutes  from "./routes/auth"
import  creditRoutes from "./routes/credits"

const app = express()

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:8000", "http://localhost:3000"],
  credentials: true
}))
app.use(express.json())

// routes
app.use("/auction", auctionRoutes)
app.use("/bid", bidRoutes)
app.use("/admin", adminRoutes)
app.use("/auth", authRoutes)
app.use("/add-credits", creditRoutes)

app.get("/", (req, res) => {
  res.send("CodeBidz backend running")
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})