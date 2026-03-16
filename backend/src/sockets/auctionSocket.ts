import { Server } from "socket.io"

export function initAuctionSocket(io: Server) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("disconnect", () => {
      console.log("User disconnected")
    })
  })
}