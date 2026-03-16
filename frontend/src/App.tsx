import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import AuctionRoom from "./pages/AuctionRoom"

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route path="/login" element={<Login />} />

        <Route path="/auction/:id" element={<AuctionRoom />} />

      </Routes>

    </BrowserRouter>
  )
}

export default App