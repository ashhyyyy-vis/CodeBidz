import express from "express"
import { authenticateUser } from "../middleware/auth"
import * as auctionController from "../controllers/auctionController"

const router = express.Router()

router.post("/auction", authenticateUser, auctionController.createAuction)

export default router