import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { adminUpdateRide, getDb, onDbChanged, runQuery } from "../lib/db";

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

const RIDE_TYPES = ["Water", "Rollercoaster", "3D", "Carousel", "Ferris Wheel", "Vertical"] as const;
const RIDE_STATUS = ["Open", "Maintenance", "Construction", "Closed"] as const;

export function Rides() {
  const [rows, setRows] = useState<RideRow[]>([]);
  const [editDraft, setEditDraft] = useState<RideRow | null>(null);
  const [rideMsg, setRideMsg] = useState<string | null>(null);
  const [rideErr, setRideErr] = useState<string | null>(null);

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

  const beginEdit = (r: RideRow) => {
    setRideErr(null);
    setRideMsg(null);
    setEditDraft({ ...r });
  };

  const saveEdit = async () => {
    if (!editDraft) return;
    setRideErr(null);
    try {
      await adminUpdateRide({
        rideId: editDraft.ride_id,
        name: editDraft.name,
        duration: editDraft.duration,
        capacity: editDraft.capacity,
        type: editDraft.type,
        minHeight: editDraft.min_height,
        status: editDraft.status,
      });
      setRideMsg(`Updated ${editDraft.name}.`);
      setEditDraft(null);
      window.setTimeout(() => setRideMsg(null), 3500);
    } catch (e) {
      setRideErr(e instanceof Error ? e.message : "Could not update ride.");
    }
  };

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
            <div className="ride-card__actions">
              <button type="button" className="btn-ghost btn-ghost--sm" onClick={() => beginEdit(a)}>
                Update details
              </button>
            </div>
          </motion.article>
        ))}
      </div>

      {rideMsg ? <p className="rides-toast rides-toast--ok">{rideMsg}</p> : null}
      {rideErr ? <p className="rides-toast rides-toast--err">{rideErr}</p> : null}

      {editDraft ? (
        <motion.section
          className="rides-update glass"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="rides-update__title">Update ride #{editDraft.ride_id}</h2>
          <p className="page-lead admin-note">Changes apply everywhere this ride appears (including Admin).</p>
          <div className="admin-form-stack">
            <label className="field">
              <span>Name</span>
              <input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} />
            </label>
            <div className="admin-inline">
              <label className="field">
                <span>Duration (min)</span>
                <input
                  type="number"
                  min={1}
                  value={editDraft.duration}
                  onChange={(e) => setEditDraft({ ...editDraft, duration: Number(e.target.value) })}
                />
              </label>
              <label className="field">
                <span>Capacity</span>
                <input
                  type="number"
                  min={1}
                  value={editDraft.capacity}
                  onChange={(e) => setEditDraft({ ...editDraft, capacity: Number(e.target.value) })}
                />
              </label>
              <label className="field">
                <span>Min height (ft)</span>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={editDraft.min_height}
                  onChange={(e) => setEditDraft({ ...editDraft, min_height: Number(e.target.value) })}
                />
              </label>
            </div>
            <label className="field">
              <span>Type</span>
              <select
                value={editDraft.type}
                onChange={(e) => setEditDraft({ ...editDraft, type: e.target.value })}
              >
                {RIDE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select
                value={editDraft.status}
                onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value })}
              >
                {RIDE_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-edit-actions">
              <button type="button" className="btn-primary" onClick={() => void saveEdit()}>
                Save changes
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setEditDraft(null);
                  setRideErr(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.section>
      ) : null}
    </div>
  );
}
