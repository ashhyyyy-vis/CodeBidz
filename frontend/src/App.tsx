import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import AuctionRoom from "./pages/AuctionRoom"
import LoginSelect from "./pages/LoginSelect"
function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route path="/login" element={<LoginSelect />} />

        <Route path="/login/:role" element={<Login />} />

        <Route path="/auction/:id" element={<AuctionRoom />} />

      </Routes>

    </BrowserRouter>
  )
}

export default App