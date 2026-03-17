// routes/auth.ts
import express from "express";
import { supabase } from "../config/supabase";
import { authenticateUser } from "../middleware/auth";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // For now, treat username as email for Supabase auth
    const userEmail = username.includes('@') ? username : `${username}@codebidz-${Date.now()}.local`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, credits, username')
      .eq('id', data.user.id)
      .single();

    // Return token and user info for new frontend structure
    return res.status(200).json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile?.role || 'bidder',
        credits: profile?.credits || 0,
        username: profile?.username || username,
        availableCredits: profile?.credits || 0,
        heldCredits: 0
      }
    });

  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Create user in Supabase auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          username: username
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username,
          role: 'bidder',
          credits: 100 // Give new users 100 credits
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return res.status(400).json({ error: profileError.message || "Failed to create profile" });
      } else {
        console.log('Profile created successfully for user:', data.user.id);
      }
    }

    return res.status(201).json({
      message: "User registered successfully",
      user: data.user,
    });

  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user info
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, credits, username')
      .eq('id', req.user!.id)
      .single();

    res.json({
      id: req.user!.id,
      email: req.user!.email,
      role: profile?.role || 'bidder',
      credits: profile?.credits || 0,
      username: profile?.username || req.user!.email?.split('@')[0],
      availableCredits: profile?.credits || 0,
      heldCredits: 0
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user info" });
  }
});

export default router;