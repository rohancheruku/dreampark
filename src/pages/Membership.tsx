import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDb, onDbChanged, purchaseMembership, runQuery } from "../lib/db";

type Park = { theme_park_id: number; name: string; location: string | null };

const TIERS = [
  {
    type: "Basic" as const,
    price: 99.99,
    blurb: "Single guest, home park plus one partner park on the pass.",
    guests: 1,
  },
  {
    type: "Premium" as const,
    price: 179.99,
    blurb: "Up to two guests, primary park plus a companion park.",
    guests: 2,
  },
  {
    type: "Family" as const,
    price: 299.99,
    blurb: "Bring the crew—2–8 guests listed on the plan, all Dream Park locations.",
    guests: 6,
  },
];

export function Membership() {
  const [parks, setParks] = useState<Park[]>([]);
  const [parkId, setParkId] = useState<number>(1);
  const [tier, setTier] = useState<(typeof TIERS)[number]["type"]>("Basic");
  const [numGuests, setNumGuests] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const loadParks = useCallback(async () => {
    await getDb();
    const rows = await runQuery(
      "SELECT theme_park_id, name, location FROM theme_park ORDER BY theme_park_id",
    );
    const list = rows.map((r) => ({
      theme_park_id: Number(r.theme_park_id),
      name: String(r.name),
      location: r.location === null ? null : String(r.location),
    }));
    setParks(list);
    setParkId((prev) => (list.some((p) => p.theme_park_id === prev) ? prev : list[0]?.theme_park_id ?? 1));
  }, []);

  useEffect(() => {
    void loadParks();
  }, [loadParks]);

  useEffect(() => {
    return onDbChanged(() => {
      void loadParks();
    });
  }, [loadParks]);

  useEffect(() => {
    if (tier === "Basic") setNumGuests(1);
    if (tier === "Premium") setNumGuests((g) => (g < 1 ? 1 : g > 2 ? 2 : g));
    if (tier === "Family") setNumGuests((g) => (g < 2 ? 2 : g > 8 ? 8 : g));
  }, [tier]);

  const selectedTier = useMemo(() => TIERS.find((t) => t.type === tier)!, [tier]);

  const buy = async () => {
    setMessage(null);
    if (!name.trim() || !email.trim()) {
      setMessage("Please enter your name and email.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const { total } = await purchaseMembership({
        fullName: name.trim(),
        email: email.trim(),
        type: tier,
        themeParkId: parkId,
        numGuests,
      });
      setMessage(`Membership saved. Plan total: $${total.toFixed(2)} (matches catalog price).`);
      setStatus("done");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not complete membership.");
      setStatus("error");
    }
  };

  return (
    <div className="page-shell membership-page">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="page-kicker">Memberships</p>
        <h1 className="page-title display">Season access that mirrors the database</h1>
      </motion.div>

      <div className="membership-grid">
        <div className="tier-list">
          {TIERS.map((t, i) => (
            <motion.article
              key={t.type}
              className={`tier-card glass${tier === t.type ? " tier-card--selected" : ""}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              whileHover={{ y: -2 }}
            >
              <button type="button" className="tier-select" onClick={() => setTier(t.type)}>
                <div className="tier-card__top">
                  <h2>{t.type}</h2>
                  <span className="tier-price">${t.price.toFixed(2)}</span>
                </div>
                <p className="tier-desc">{t.blurb}</p>
              </button>
            </motion.article>
          ))}
        </div>

        <motion.aside className="cart glass" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
          <h3>Checkout</h3>
          <label className="field">
            <span>Home park</span>
            <select value={parkId} onChange={(e) => setParkId(Number(e.target.value))}>
              {parks.map((p) => (
                <option key={p.theme_park_id} value={p.theme_park_id}>
                  {p.name}
                  {p.location ? ` — ${p.location}` : ""}
                </option>
              ))}
            </select>
          </label>

          {tier !== "Basic" ? (
            <label className="field">
              <span>Guests on plan ({tier === "Premium" ? "1–2" : "2–8"})</span>
              <input
                type="number"
                min={tier === "Premium" ? 1 : 2}
                max={tier === "Premium" ? 2 : 8}
                value={numGuests}
                onChange={(e) => setNumGuests(Number(e.target.value))}
              />
            </label>
          ) : (
            <p className="cart-empty">Basic includes exactly one named guest.</p>
          )}

          <label className="field">
            <span>Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Mills" />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
          </label>

          <div className="cart-totals">
            <div className="cart-totals__total">
              <span>Due today</span>
              <span>${selectedTier.price.toFixed(2)}</span>
            </div>
          </div>

          <button type="button" className="btn-primary cart-checkout" disabled={status === "loading"} onClick={buy}>
            {status === "loading" ? "Saving…" : "Purchase membership"}
          </button>
          {message ? (
            <p className={`cart-msg cart-msg--${status === "error" ? "err" : "ok"}`}>{message}</p>
          ) : null}
        </motion.aside>
      </div>
    </div>
  );
}
