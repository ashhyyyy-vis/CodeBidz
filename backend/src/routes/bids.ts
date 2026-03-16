import express from "express"
import { authenticateUser } from "../middleware/auth"
import * as bidController from "../controllers/bidController"

const router = express.Router()

router.post("/", authenticateUser, bidController.placeBid)

export default router