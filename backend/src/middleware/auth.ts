///   <reference path="../types/express.d.ts" />

import { Request, Response, NextFunction } from "express"
import { supabase } from "../config/supabase"

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const token = authHeader.split(" ")[1]

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid token" })
  }

  req.user = data.user

  next()
}