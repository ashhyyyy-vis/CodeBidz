import { useEffect, useState } from "react"
import api from "../api/axios"
import type { Auction } from "../types/auction"
import { useAuth } from "../context/AuthContext"
import { Link } from "react-router-dom"

type Filter = "all" | "active" | "closed"

export default function Dashboard() {

  const { user } = useAuth()
  
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [filter, setFilter] = useState<Filter>("all")

  useEffect(() => {
    const loadAuctions = async () => {
      const res = await api.get<Auction[]>("/auctions", {
        params: { filter } // you'll handle backend
      })
      setAuctions(res.data)
    }

    loadAuctions()
  }, [filter])

  return (
    <div className="min-h-screen flex flex-col">
      {/* 🔝 TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3 border-b w-full">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <button className="text-xl">☰</button>
          <h1 className="text-xl font-semibold">CodeBidz</h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center">
          {!user ? (
            <Link to="/login">Login</Link>
          ) : (
            <span>Profile</span>
          )}
        </div>
      </div>

      {/* 🔽 BODY */}
      <div className="p-4 flex-1">

        {/* Toggle */}
        <div className="flex gap-2 mb-4">

          <button
            onClick={() => setFilter("all")}
            className={filter === "all" ? "font-bold" : ""}
          >
            All
          </button>

          <button
            onClick={() => setFilter("active")}
            className={filter === "active" ? "font-bold" : ""}
          >
            Active
          </button>

          <button
            onClick={() => setFilter("closed")}
            className={filter === "closed" ? "font-bold" : ""}
          >
            Closed
          </button>

        </div>

        {/* Auctions */}
        <div className="flex flex-col gap-3">

          {auctions.map(a => (
            <div
              key={a.id}
              className="border p-3 rounded"
            >
              <h3>{a.title}</h3>
              <p>Current Bid: {a.current_bid}</p>

              {/* Admin-only controls */}
              {user && (user.user_metadata?.role === "admin") && (
                <div className="mt-2">
                  <button>End Auction</button>
                </div>
              )}
            </div>
          ))}

        </div>

      </div>

    </div>
  )
}