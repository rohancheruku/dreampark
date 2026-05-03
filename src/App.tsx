import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Operations } from "./pages/Operations";
import { Rides } from "./pages/Rides";
import { Tickets } from "./pages/Tickets";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/rides" element={<Rides />} />
        <Route path="/operations" element={<Operations />} />
      </Route>
    </Routes>
  );
}
