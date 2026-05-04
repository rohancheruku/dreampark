import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FerrisWheelBg } from "../components/FerrisWheelBg";
import { fetchPresentCustomers, getDb, onDbChanged, type PresentCustomer } from "../lib/db";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Home() {
  const [customers, setCustomers] = useState<PresentCustomer[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  const refreshCustomers = useCallback(async () => {
    await getDb();
    const rows = await fetchPresentCustomers();
    setCustomers(rows);
    setUpdatedAt(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    void refreshCustomers();
    const unsub = onDbChanged(() => {
      void refreshCustomers();
    });
    const id = window.setInterval(() => {
      void refreshCustomers();
    }, 12000);
    return () => {
      unsub();
      window.clearInterval(id);
    };
  }, [refreshCustomers]);

  return (
    <div className="home">
      <FerrisWheelBg />
      <div className="home-inner">
        <section className="home-hero">
          <motion.h1 className="home-title display" custom={0} variants={fadeUp} initial="hidden" animate="show">
            Where gravity
            <span className="home-title__accent"> takes a holiday</span>
          </motion.h1>
          <motion.p className="home-lead" custom={1} variants={fadeUp} initial="hidden" animate="show">
            Pick your park, lock in day passes or VIP, and spend the day on coasters, water rides, and skyline wheels.
            Check current wait times anytime so you line up smarter, not longer.
          </motion.p>
          <motion.div className="home-cta" custom={2} variants={fadeUp} initial="hidden" animate="show">
            <Link to="/tickets" className="btn-primary">
              Get tickets
            </Link>
            <Link to="/membership" className="btn-ghost">
              Memberships
            </Link>
            <Link to="/operations" className="btn-ghost">
              Wait times
            </Link>
          </motion.div>
          <motion.div
            className="home-stats glass-subtle"
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <div>
              <span className="home-stats__num">30</span>
              <span className="home-stats__lbl">rides &amp; attractions</span>
            </div>
            <div className="home-stats__divider" />
            <div>
              <span className="home-stats__num">3</span>
              <span className="home-stats__lbl">theme parks</span>
            </div>
            <div className="home-stats__divider" />
            <div>
              <span className="home-stats__num">3</span>
              <span className="home-stats__lbl">ticket types</span>
            </div>
            <div className="home-stats__divider" />
            <div>
              <span className="home-stats__num">∞</span>
              <span className="home-stats__lbl">satisfied dreamers</span>
            </div>
          </motion.div>
        </section>

        <motion.section
          className="home-customers glass"
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div className="home-customers__head">
            <div>
              <p className="home-kicker">In the park right now</p>
              <h2 className="home-customers__title display">Guests with an active ticket</h2>
            </div>
            {updatedAt ? <span className="home-customers__stamp">Updated {updatedAt}</span> : null}
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Email</th>
                  <th>Ticket</th>
                  <th>Park</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="home-customers__empty">
                      No ticket holders yet—be the first on the Tickets page.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={`${c.visitor_id}-${c.ticket_id}`}>
                      <td>
                        {c.first_name} {c.last_name}
                      </td>
                      <td>{c.email ?? "—"}</td>
                      <td>
                        <span className="ticket-pill">{c.ticket_type}</span>{" "}
                        <span className="muted-xs">#{c.ticket_id}</span>
                      </td>
                      <td>{c.park_name}</td>
                      <td>${c.ticket_price.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
