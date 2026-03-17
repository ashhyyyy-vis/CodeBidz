import api from "../api/axios"
import { supabase } from "../lib/supabase"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useParams } from "react-router-dom"

export default function Login() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const {role} = useParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isRegister, setIsRegister] = useState(false)

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isRegister) {

        // Check passwords match
        if (password !== confirmPassword) {
          alert("Passwords do not match")
          return
        }

        const res = await api.post("/auth/register", {
          email,
          password,
          confirmPassword
        })
        alert(res.data.message)
        setIsRegister(false)

      } else {
        const res = await api.post("/auth/login", {
          email,
          password
        })
        
        // Update auth context with user data
        if (res.data.user) {
          setUser(res.data.user)
        }
        
        alert(res.data.message)
        navigate("/dashboard") // Redirect to dashboard after successful login
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Authentication failed")
    }
  }

  return (
    <div style={{
      display:"flex",
      height:"100vh",
      alignItems:"center",
      justifyContent:"center",
      flexDirection:"column",
      gap:"16px"
    }}>

      <h1>
        {role === "admin" ? "Admin Login" : "User Login"}
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{display:"flex", flexDirection:"column", gap:"8px"}}
      >

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* 👇 Only shows in register mode */}
        {role!=="admin"&&isRegister && (
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        )}

        <button type="submit">
          {isRegister ? "Register" : "Login"}
        </button>

      </form>

      {/* Toggle */}
      {role!=="admin"&&(<button
        style={{cursor:"pointer"}}
        onClick={() => {
          console.log("Before toggle:", isRegister);
          setIsRegister(!isRegister);
          console.log("After toggle:", !isRegister);
        }}
      >
        {isRegister
          ? "Already have an account? Login"
          : "New user? Register"}
      </button>
      )}
      

      <button onClick={signInWithGoogle}>
        Sign in with Google
      </button>

    </div>
  )
}