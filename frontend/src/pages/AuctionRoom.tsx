import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

const socket: Socket = io("http://localhost:5000")

export default function AuctionRoom() {

  const [currentBid, setCurrentBid] = useState<number>(0)
  const [bid, setBid] = useState<number>(0)

  useEffect(() => {

    socket.on("bid-update", (data: { bid: number }) => {
      setCurrentBid(data.bid)
    })

    return () => {
      socket.off("bid-update")
    }

  }, [])

  const placeBid = () => {
    socket.emit("place-bid", {
      amount: bid
    })
  }

  return (
    <div>

      <h2>Current Bid: {currentBid}</h2>

      <input
        type="number"
        onChange={(e) => setBid(Number(e.target.value))}
      />

      <button onClick={placeBid}>
        Bid
      </button>

    </div>
  )
}