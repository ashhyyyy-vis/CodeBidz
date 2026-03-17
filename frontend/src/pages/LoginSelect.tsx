import { useNavigate } from "react-router-dom"

export default function LoginSelect() {

  const navigate = useNavigate()

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-6">

      <h1 className="text-2xl font-semibold">Welcome to CodeBidz</h1>

      <div className="flex gap-4">

        <button
          onClick={() => navigate("/login/user")}
          className="px-6 py-3 border rounded"
        >
          User Login
        </button>

        <button
          onClick={() => navigate("/login/admin")}
          className="px-6 py-3 border rounded"
        >
          Admin Login
        </button>

      </div>

    </div>
  )
}