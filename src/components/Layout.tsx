import { motion } from "framer-motion";
import { NavLink, Outlet } from "react-router-dom";
import { LogoMark } from "./LogoMark";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-pill${isActive ? " nav-pill--active" : ""}`;

export function Layout() {
  return (
    <>
      <motion.header
        className="site-header glass"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        <NavLink to="/" className="site-logo">
          <LogoMark />
          <span className="site-logo__text">Dream Park</span>
        </NavLink>
        <nav className="site-nav">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/tickets" className={navLinkClass}>
            Tickets
          </NavLink>
          <NavLink to="/membership" className={navLinkClass}>
            Membership
          </NavLink>
          <NavLink to="/rides" className={navLinkClass}>
            Rides
          </NavLink>
          <NavLink to="/operations" className={navLinkClass}>
            Wait times
          </NavLink>
          <NavLink to="/admin" className={navLinkClass}>
            Admin
          </NavLink>
        </nav>
      </motion.header>
      <Outlet />
    </>
  );
}
