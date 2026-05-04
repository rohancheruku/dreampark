import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { getDb, onDbChanged, runQuery } from "../lib/db";

export function Operations() {
  const [rows, setRows] = useState<Record<string, string | number | null>[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    await getDb();
    const sql = `
      SELECT
        tp.name AS park,
        r.name AS ride,
        r.wait_minutes,
        r.recorded_at,
        r.status AS ride_status,
        r.type AS ride_type
      FROM ride r
      JOIN theme_park tp ON tp.theme_park_id = r.theme_park_id
      WHERE r.wait_minutes IS NOT NULL AND r.recorded_at IS NOT NULL
      ORDER BY r.recorded_at DESC
    `;
    const r = await runQuery(sql);
    setRows(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return onDbChanged(() => {
      void load();
    });
  }, [load]);

  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div className="page-shell operations-page">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="page-kicker">Park operations</p>
        <h1 className="page-title display">Live wait times</h1>
      </motion.div>

      <motion.div
        className="table-wrap glass"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {loading ? (
          <p className="table-loading shimmer" style={{ padding: "1.5rem", margin: 0 }}>
            Loading query results…
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c}>{c.replace(/_/g, " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c}>{row[c] ?? "-"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
