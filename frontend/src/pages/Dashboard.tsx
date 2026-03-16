import { useEffect, useState } from "react"
import api from "../api/axios"
import type { Auction } from "../types/auction"

export default function Dashboard() {

  const [auctions, setAuctions] = useState<Auction[]>([])

  useEffect(() => {
    const loadAuctions = async () => {
      const res = await api.get<Auction[]>("/auction")
      setAuctions(res.data)
    }

    loadAuctions()
  }, [])

  return (
    <div>
      <h1>Active Auctions</h1>

      {auctions.map(a => (
        <div key={a.id}>
          <h3>{a.title}</h3>
          <p>Current Bid: {a.current_bid}</p>
        </div>
      ))}
    </div>
  )
}