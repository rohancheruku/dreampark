import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { getDb, onDbChanged, runQuery } from "../lib/db";

type RideRow = {
  ride_id: number;
  name: string;
  park_name: string;
  type: string;
  min_height: number;
  duration: number;
  capacity: number;
  status: string;
};

const statusTone: Record<string, string> = {
  Open: "status-pill--open",
  Maintenance: "status-pill--maint",
  Construction: "status-pill--maint",
  Closed: "status-pill--closed",
};

export function Rides() {
  const [rows, setRows] = useState<RideRow[]>([]);

  const load = useCallback(async () => {
    await getDb();
    const r = await runQuery(`
      SELECT
        r.ride_id,
        r.name,
        tp.name AS park_name,
        r.type,
        r.min_height,
        r.duration,
        r.capacity,
        r.status
      FROM ride r
      JOIN theme_park tp ON tp.theme_park_id = r.theme_park_id
      ORDER BY tp.name ASC, r.status ASC, r.name ASC
    `);
    setRows(
      r.map((x) => ({
        ride_id: Number(x.ride_id),
        name: String(x.name),
        park_name: String(x.park_name),
        type: String(x.type),
        min_height: Number(x.min_height),
        duration: Number(x.duration),
        capacity: Number(x.capacity),
        status: String(x.status),
      })),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return onDbChanged(() => {
      void load();
    });
  }, [load]);

  return (
    <div className="page-shell rides-page">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="page-kicker">Attractions</p>
        <h1 className="page-title display">Rides &amp; experiences</h1>
      </motion.div>

      <div className="rides-grid">
        {rows.map((a, i) => (
          <motion.article
            key={a.ride_id}
            className="ride-card glass"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="ride-card__head">
              <h2>{a.name}</h2>
              <span className={`status-pill ${statusTone[a.status] ?? ""}`}>{a.status}</span>
            </div>
            <p className="ride-cat">
              {a.type} · {a.park_name}
            </p>
            <div className="ride-meta">
              <span>{a.duration} min cycle</span>
              <span>Min height {a.min_height} ft</span>
              <span>Cap. {a.capacity}</span>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
