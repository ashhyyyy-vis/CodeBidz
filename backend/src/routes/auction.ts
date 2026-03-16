import express from "express"
import * as auctionController from "../controllers/auctionController"

const router = express.Router()

router.get("/", auctionController.getAllAuctions)
router.get("/:id", auctionController.getAuction)

export default router