import express from "express"
import cors from "cors"
import dotenv from "dotenv"


dotenv.config()

import  auctionRoutes from "./routes/auction"
import  bidRoutes  from "./routes/bids"
import  adminRoutes  from "./routes/admin"


const app = express()

app.use(cors())
app.use(express.json())

// routes
app.use("/auction", auctionRoutes)
app.use("/bid", bidRoutes)
app.use("/admin", adminRoutes)

app.get("/", (req, res) => {
  res.send("CodeBidz backend running")
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})