import { supabase } from "../lib/supabase"

export default function Login() {

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    })
  }

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
    })
  }

  return (
    <div style={{display:"flex", height:"100vh", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"16px"}}>

      <h1>CodeBidz</h1>

      <button onClick={signInWithGoogle}>
        Sign in with Google
      </button>

      <button onClick={signInWithGithub}>
        Sign in with GitHub
      </button>

    </div>
  )
}