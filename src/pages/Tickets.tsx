import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { checkoutOrder, DEFAULT_TAX_RATE, getDb, runQuery } from "../lib/db";

type TicketOffer = {
  theme_park_id: number;
  park_name: string;
  park_location: string | null;
  type: string;
  price: number;
  duration: number;
};

type CartLine = { offer: TicketOffer; quantity: number };

export function Tickets() {
  const [offers, setOffers] = useState<TicketOffer[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await getDb();
      const rows = await runQuery(`
        SELECT
          t.theme_park_id,
          tp.name AS park_name,
          tp.location AS park_location,
          t.type,
          t.price,
          t.duration
        FROM ticket t
        JOIN theme_park tp ON tp.theme_park_id = t.theme_park_id
        GROUP BY t.theme_park_id, tp.name, tp.location, t.type, t.price, t.duration
        ORDER BY t.theme_park_id,
          CASE t.type WHEN 'Regular' THEN 1 WHEN 'VIP' THEN 2 ELSE 3 END
      `);
      if (!cancelled) {
        setOffers(
          rows.map((r) => ({
            theme_park_id: Number(r.theme_park_id),
            park_name: String(r.park_name),
            park_location: r.park_location === null ? null : String(r.park_location),
            type: String(r.type),
            price: Number(r.price),
            duration: Number(r.duration),
          })),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const offerKey = (o: TicketOffer) => `${o.theme_park_id}-${o.type}`;

  const addToCart = useCallback((offer: TicketOffer) => {
    setCart((c) => {
      const k = offerKey(offer);
      const existing = c.find((l) => offerKey(l.offer) === k);
      if (existing) {
        return c.map((l) => (offerKey(l.offer) === k ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...c, { offer, quantity: 1 }];
    });
  }, []);

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.offer.price * l.quantity, 0), [cart]);
  const tax = useMemo(() => Math.round(subtotal * DEFAULT_TAX_RATE * 100) / 100, [subtotal]);
  const total = useMemo(() => Math.round((subtotal + tax) * 100) / 100, [subtotal, tax]);

  const checkout = async () => {
    setMessage(null);
    if (!name.trim() || !email.trim()) {
      setMessage("Please add your name and email so we can send your confirmation.");
      setStatus("error");
      return;
    }
    if (!cart.length) {
      setMessage("Your cart is empty. Add a pass to continue.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const lines = cart.map((l) => ({
        themeParkId: l.offer.theme_park_id,
        type: l.offer.type,
        price: l.offer.price,
        duration: l.offer.duration,
        quantity: l.quantity,
      }));
      const { totalTickets, total: paid } = await checkoutOrder({
        fullName: name.trim(),
        email: email.trim(),
        lines,
      });
      setMessage(
        `You are all set: ${totalTickets} ticket${totalTickets === 1 ? "" : "s"} for $${paid.toFixed(2)} total, tax included.`,
      );
      setStatus("done");
      setCart([]);
    } catch {
      setMessage("Something went wrong. Please try again in a moment.");
      setStatus("error");
    }
  };

  return (
    <div className="page-shell tickets-page">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <p className="page-kicker">Tickets</p>
        <h1 className="page-title display">Passes that match your adrenaline budget</h1>
      </motion.div>

      <div className="tickets-grid">
        <div className="tier-list">
          {offers.map((offer, i) => (
            <motion.article
              key={offerKey(offer)}
              className="tier-card glass"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="tier-card__top">
                <h2>
                  {offer.type} · {offer.park_name}
                </h2>
                {offer.type === "VIP" ? <span className="tier-badge">VIP</span> : null}
              </div>
              <p className="tier-desc">
                {offer.type === "Member"
                  ? "Complimentary admission for qualifying members at this park."
                  : `Valid for ${offer.duration} day${offer.duration > 1 ? "s" : ""} at this location.`}
              </p>
              {offer.park_location ? (
                <p className="tier-meta">{offer.park_location}</p>
              ) : null}
              <div className="tier-card__bottom">
                <span className="tier-price">${offer.price.toFixed(2)}</span>
                <button type="button" className="btn-ghost tier-add" onClick={() => addToCart(offer)}>
                  Add
                </button>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.aside
          className="cart glass"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <h3>Your cart</h3>
          <AnimatePresence initial={false}>
            {cart.length === 0 ? (
              <motion.p
                key="empty"
                className="cart-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Tap add on a pass. Quantities stack per offer.
              </motion.p>
            ) : (
              <ul className="cart-lines">
                {cart.map((line) => (
                  <motion.li
                    key={offerKey(line.offer)}
                    layout
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                  >
                    <span>
                      {line.offer.type} ({line.offer.park_name}) × {line.quantity}
                    </span>
                    <span>${(line.offer.price * line.quantity).toFixed(2)}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </AnimatePresence>

          <div className="cart-totals">
            <div>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div>
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="cart-totals__total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <label className="field">
            <span>Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Mills" />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
            />
          </label>

          <button type="button" className="btn-primary cart-checkout" disabled={status === "loading"} onClick={checkout}>
            {status === "loading" ? "Processing…" : "Complete purchase"}
          </button>

          {message ? (
            <p className={`cart-msg cart-msg--${status === "error" ? "err" : "ok"}`}>{message}</p>
          ) : null}
        </motion.aside>
      </div>
    </div>
  );
}
