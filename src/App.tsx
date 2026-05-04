import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Admin } from "./pages/Admin";
import { Home } from "./pages/Home";
import { Membership } from "./pages/Membership";
import { Operations } from "./pages/Operations";
import { Rides } from "./pages/Rides";
import { Tickets } from "./pages/Tickets";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/rides" element={<Rides />} />
        <Route path="/operations" element={<Operations />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}
