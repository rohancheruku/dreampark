import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  adminAddRide,
  adminAddThemePark,
  adminDeleteRide,
  adminDeleteThemePark,
  adminFireEmployee,
  adminSetDepartmentHead,
  adminUpdateEmployee,
  adminUpdateRide,
  getDb,
  onDbChanged,
  resetPersistedDatabase,
  runQuery,
} from "../lib/db";

type Park = {
  theme_park_id: number;
  name: string;
  location: string | null;
  number_of_rides: number;
  hasDepartments: boolean;
};
type RideAdmin = {
  ride_id: number;
  name: string;
  theme_park_id: number;
  park_name: string;
  type: string;
  status: string;
  duration: number;
  capacity: number;
  min_height: number;
};

type DeptRow = {
  department_id: number;
  name: string;
  num_employees: number;
  dept_head_id: number | null;
  theme_park_id: number | null;
  park_name: string | null;
};

type EmpRow = {
  employee_id: number;
  first_name: string;
  last_name: string;
  department_id: number | null;
  salary: number;
  phone_number: string | null;
  address: string | null;
};

const RIDE_TYPES = ["Water", "Rollercoaster", "3D", "Carousel", "Ferris Wheel", "Vertical"] as const;
const RIDE_STATUS = ["Open", "Maintenance", "Construction", "Closed"] as const;

export function Admin() {
  const [parks, setParks] = useState<Park[]>([]);
  const [rides, setRides] = useState<RideAdmin[]>([]);
  const [departments, setDepartments] = useState<DeptRow[]>([]);
  const [employees, setEmployees] = useState<EmpRow[]>([]);
  const [editingRide, setEditingRide] = useState<RideAdmin | null>(null);
  const [editEmp, setEditEmp] = useState<EmpRow | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [newParkName, setNewParkName] = useState("");
  const [newParkLoc, setNewParkLoc] = useState("");

  const [rideParkId, setRideParkId] = useState(1);
  const [rideName, setRideName] = useState("");
  const [rideDuration, setRideDuration] = useState(5);
  const [rideCap, setRideCap] = useState(24);
  const [rideType, setRideType] = useState<string>(RIDE_TYPES[0]);
  const [rideMinH, setRideMinH] = useState(3.5);
  const [rideStatus, setRideStatus] = useState<string>("Open");

  const load = useCallback(async () => {
    await getDb();
    const deptRows = await runQuery(
      "SELECT theme_park_id FROM department WHERE theme_park_id IS NOT NULL",
    );
    const deptParks = new Set(deptRows.map((r) => Number(r.theme_park_id)));
    const p = await runQuery(
      "SELECT theme_park_id, name, location, number_of_rides FROM theme_park ORDER BY theme_park_id",
    );
    setParks(
      p.map((r) => ({
        theme_park_id: Number(r.theme_park_id),
        name: String(r.name),
        location: r.location === null ? null : String(r.location),
        number_of_rides: Number(r.number_of_rides),
        hasDepartments: deptParks.has(Number(r.theme_park_id)),
      })),
    );
    const r = await runQuery(`
      SELECT r.ride_id, r.name, r.theme_park_id, tp.name AS park_name, r.type, r.status,
        r.duration, r.capacity, r.min_height
      FROM ride r
      JOIN theme_park tp ON tp.theme_park_id = r.theme_park_id
      ORDER BY tp.theme_park_id, r.ride_id
    `);
    setRides(
      r.map((x) => ({
        ride_id: Number(x.ride_id),
        name: String(x.name),
        theme_park_id: Number(x.theme_park_id),
        park_name: String(x.park_name),
        type: String(x.type),
        status: String(x.status),
        duration: Number(x.duration),
        capacity: Number(x.capacity),
        min_height: Number(x.min_height),
      })),
    );
    const d = await runQuery(`
      SELECT d.department_id, d.name, d.num_employees, d.dept_head_id, d.theme_park_id,
        tp.name AS park_name
      FROM department d
      LEFT JOIN theme_park tp ON tp.theme_park_id = d.theme_park_id
      ORDER BY d.theme_park_id, d.department_id
    `);
    setDepartments(
      d.map((row) => ({
        department_id: Number(row.department_id),
        name: String(row.name),
        num_employees: Number(row.num_employees),
        dept_head_id: row.dept_head_id === null ? null : Number(row.dept_head_id),
        theme_park_id: row.theme_park_id === null ? null : Number(row.theme_park_id),
        park_name: row.park_name === null ? null : String(row.park_name),
      })),
    );
    const em = await runQuery(`
      SELECT employee_id, first_name, last_name, department_id, salary, phone_number, address
      FROM employee
      ORDER BY department_id, last_name, first_name
    `);
    setEmployees(
      em.map((row) => ({
        employee_id: Number(row.employee_id),
        first_name: String(row.first_name),
        last_name: String(row.last_name),
        department_id: row.department_id === null ? null : Number(row.department_id),
        salary: Number(row.salary),
        phone_number: row.phone_number === null ? null : String(row.phone_number),
        address: row.address === null ? null : String(row.address),
      })),
    );
    setRideParkId((prev) => (p.some((row) => Number(row.theme_park_id) === prev) ? prev : Number(p[0]?.theme_park_id) || 1));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return onDbChanged(() => {
      void load();
    });
  }, [load]);

  const flash = (text: string) => {
    setErr(null);
    setMsg(text);
    window.setTimeout(() => setMsg(null), 4000);
  };

  const addPark = async () => {
    setErr(null);
    if (!newParkName.trim()) {
      setErr("Park name is required.");
      return;
    }
    try {
      const id = await adminAddThemePark({ name: newParkName.trim(), location: newParkLoc.trim() });
      setNewParkName("");
      setNewParkLoc("");
      flash(`Added theme park #${id} with a starter hub ride.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not add park.");
    }
  };

  const removePark = async (id: number) => {
    setErr(null);
    try {
      await adminDeleteThemePark(id);
      flash(`Removed theme park #${id}.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not remove park.");
    }
  };

  const addRide = async () => {
    setErr(null);
    if (!rideName.trim()) {
      setErr("Ride name is required.");
      return;
    }
    try {
      const id = await adminAddRide({
        themeParkId: rideParkId,
        name: rideName.trim(),
        duration: rideDuration,
        capacity: rideCap,
        type: rideType,
        minHeight: rideMinH,
        status: rideStatus,
      });
      setRideName("");
      flash(`Added ride #${id}.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not add ride.");
    }
  };

  const removeRide = async (rideId: number) => {
    setErr(null);
    try {
      await adminDeleteRide(rideId);
      if (editingRide?.ride_id === rideId) setEditingRide(null);
      flash(`Removed ride #${rideId}.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not remove ride.");
    }
  };

  const saveRideEdit = async () => {
    if (!editingRide) return;
    setErr(null);
    try {
      await adminUpdateRide({
        rideId: editingRide.ride_id,
        name: editingRide.name,
        duration: editingRide.duration,
        capacity: editingRide.capacity,
        type: editingRide.type,
        minHeight: editingRide.min_height,
        status: editingRide.status,
      });
      flash(`Updated ride #${editingRide.ride_id}.`);
      setEditingRide(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update ride.");
    }
  };

  const setDeptHead = async (departmentId: number, value: string) => {
    setErr(null);
    const v = value === "" ? null : Number(value);
    try {
      await adminSetDepartmentHead(departmentId, v);
      flash(`Department #${departmentId} head updated.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update department head.");
    }
  };

  const saveEmployee = async () => {
    if (!editEmp) return;
    setErr(null);
    try {
      await adminUpdateEmployee({
        employeeId: editEmp.employee_id,
        firstName: editEmp.first_name,
        lastName: editEmp.last_name,
        phoneNumber: editEmp.phone_number ?? "",
        salary: editEmp.salary,
        address: editEmp.address ?? "",
      });
      flash(`Updated employee #${editEmp.employee_id}.`);
      setEditEmp(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update employee.");
    }
  };

  const fireEmployee = async (emp: EmpRow) => {
    if (!window.confirm(`Fire ${emp.first_name} ${emp.last_name}? They’ll be removed from the roster.`)) return;
    setErr(null);
    try {
      await adminFireEmployee(emp.employee_id);
      if (editEmp?.employee_id === emp.employee_id) setEditEmp(null);
      flash(`Let go of employee #${emp.employee_id}.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not remove employee.");
    }
  };

  const empLabel = (e: EmpRow) => `${e.first_name} ${e.last_name} (#${e.employee_id})`;

  return (
    <div className="page-shell admin-page">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="page-kicker">Admin</p>
        <h1 className="page-title display">Parks &amp; rides</h1>
      </motion.div>

      {msg ? <p className="admin-banner admin-banner--ok">{msg}</p> : null}
      {err ? <p className="admin-banner admin-banner--err">{err}</p> : null}

      <div className="admin-grid">
        <motion.section className="glass admin-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2>Theme parks</h2>
          <div className="admin-form-row">
            <label className="field">
              <span>New park name</span>
              <input value={newParkName} onChange={(e) => setNewParkName(e.target.value)} placeholder="Lunar Gardens" />
            </label>
            <label className="field">
              <span>Location</span>
              <input value={newParkLoc} onChange={(e) => setNewParkLoc(e.target.value)} placeholder="Austin, TX" />
            </label>
            <button type="button" className="btn-primary" onClick={addPark}>
              Add park
            </button>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Rides (stored)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {parks.map((p) => (
                  <tr key={p.theme_park_id}>
                    <td>{p.theme_park_id}</td>
                    <td>
                      {p.name}
                      <div className="table-sub">{p.location}</div>
                    </td>
                    <td>{p.number_of_rides}</td>
                    <td>
                      {!p.hasDepartments ? (
                        <button type="button" className="btn-ghost btn-ghost--sm" onClick={() => removePark(p.theme_park_id)}>
                          Remove
                        </button>
                      ) : (
                        <span className="muted-xs">Has departments (seed)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section className="glass admin-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2>Add ride</h2>
          <div className="admin-form-stack">
            <label className="field">
              <span>Park</span>
              <select value={rideParkId} onChange={(e) => setRideParkId(Number(e.target.value))}>
                {parks.map((p) => (
                  <option key={p.theme_park_id} value={p.theme_park_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Name</span>
              <input value={rideName} onChange={(e) => setRideName(e.target.value)} placeholder="Comet Chaser" />
            </label>
            <div className="admin-inline">
              <label className="field">
                <span>Duration (min)</span>
                <input
                  type="number"
                  min={1}
                  value={rideDuration}
                  onChange={(e) => setRideDuration(Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span>Capacity</span>
                <input type="number" min={1} value={rideCap} onChange={(e) => setRideCap(Number(e.target.value))} />
              </label>
              <label className="field">
                <span>Min height (ft)</span>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={rideMinH}
                  onChange={(e) => setRideMinH(Number(e.target.value))}
                />
              </label>
            </div>
            <label className="field">
              <span>Type</span>
              <select value={rideType} onChange={(e) => setRideType(e.target.value)}>
                {RIDE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select value={rideStatus} onChange={(e) => setRideStatus(e.target.value)}>
                {RIDE_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn-primary" onClick={addRide}>
              Add ride
            </button>
          </div>
        </motion.section>
      </div>

      <motion.section
        className="glass admin-card admin-card--wide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Departments &amp; staff</h2>
        <p className="page-lead admin-note">
          Pick a department to see everyone on the team, assign a department head, or edit profiles. Letting someone go
          removes them from the directory (and clears head role if it was them).
        </p>
        <div className="admin-dept-list">
          {departments.map((dept) => {
            const deptEmps = employees.filter((e) => e.department_id === dept.department_id);
            const headEmp = dept.dept_head_id
              ? employees.find((e) => e.employee_id === dept.dept_head_id)
              : undefined;
            return (
              <details key={dept.department_id} className="admin-dept-details glass-subtle">
                <summary className="admin-dept-summary">
                  <span className="admin-dept-summary__title">{dept.name}</span>
                  <span className="muted-xs">
                    {dept.park_name ?? "Park"} · {deptEmps.length} staff
                    {headEmp ? ` · Head: ${headEmp.first_name} ${headEmp.last_name}` : ""}
                  </span>
                </summary>
                <div className="admin-dept-body">
                  <label className="field admin-dept-head-field">
                    <span>Department head</span>
                    <select
                      value={dept.dept_head_id ?? ""}
                      onChange={(e) => void setDeptHead(dept.department_id, e.target.value)}
                    >
                      <option value="">None</option>
                      {deptEmps.map((e) => (
                        <option key={e.employee_id} value={e.employee_id}>
                          {empLabel(e)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role tag</th>
                          <th>Phone</th>
                          <th>Salary</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {deptEmps.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="muted-xs">
                              No employees in this department.
                            </td>
                          </tr>
                        ) : (
                          deptEmps.map((emp) => (
                            <tr key={emp.employee_id}>
                              <td>
                                {emp.first_name} {emp.last_name}
                                {dept.dept_head_id === emp.employee_id ? (
                                  <span className="ticket-pill admin-head-pill">Head</span>
                                ) : null}
                              </td>
                              <td className="muted-xs">#{emp.employee_id}</td>
                              <td>{emp.phone_number ?? "—"}</td>
                              <td>${emp.salary.toLocaleString()}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-ghost btn-ghost--sm"
                                  onClick={() => setEditEmp({ ...emp })}
                                >
                                  Edit
                                </button>{" "}
                                <button
                                  type="button"
                                  className="btn-ghost btn-ghost--sm admin-fire-btn"
                                  onClick={() => void fireEmployee(emp)}
                                >
                                  Fire
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </motion.section>

      {editEmp ? (
        <motion.section
          className="glass admin-card admin-card--wide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>Edit employee #{editEmp.employee_id}</h2>
          <div className="admin-form-stack admin-form-stack--grid">
            <label className="field">
              <span>First name</span>
              <input
                value={editEmp.first_name}
                onChange={(e) => setEditEmp({ ...editEmp, first_name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Last name</span>
              <input
                value={editEmp.last_name}
                onChange={(e) => setEditEmp({ ...editEmp, last_name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Phone</span>
              <input
                value={editEmp.phone_number ?? ""}
                onChange={(e) => setEditEmp({ ...editEmp, phone_number: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Salary</span>
              <input
                type="number"
                min={1}
                step={100}
                value={editEmp.salary}
                onChange={(e) => setEditEmp({ ...editEmp, salary: Number(e.target.value) })}
              />
            </label>
            <label className="field admin-field-span2">
              <span>Address</span>
              <input
                value={editEmp.address ?? ""}
                onChange={(e) => setEditEmp({ ...editEmp, address: e.target.value })}
              />
            </label>
          </div>
          <div className="admin-edit-actions">
            <button type="button" className="btn-primary" onClick={() => void saveEmployee()}>
              Save changes
            </button>
            <button type="button" className="btn-ghost" onClick={() => setEditEmp(null)}>
              Cancel
            </button>
          </div>
        </motion.section>
      ) : null}

      <motion.section className="glass admin-card admin-card--wide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2>All rides</h2>
        <p className="page-lead admin-note">Each park must keep at least one ride (schema + UI guard).</p>

        {editingRide ? (
          <div className="admin-edit-ride glass-subtle">
            <h3 className="admin-edit-ride__title">Edit ride #{editingRide.ride_id}</h3>
            <div className="admin-form-stack">
              <label className="field">
                <span>Name</span>
                <input
                  value={editingRide.name}
                  onChange={(e) => setEditingRide({ ...editingRide, name: e.target.value })}
                />
              </label>
              <div className="admin-inline">
                <label className="field">
                  <span>Duration (min)</span>
                  <input
                    type="number"
                    min={1}
                    value={editingRide.duration}
                    onChange={(e) => setEditingRide({ ...editingRide, duration: Number(e.target.value) })}
                  />
                </label>
                <label className="field">
                  <span>Capacity</span>
                  <input
                    type="number"
                    min={1}
                    value={editingRide.capacity}
                    onChange={(e) => setEditingRide({ ...editingRide, capacity: Number(e.target.value) })}
                  />
                </label>
                <label className="field">
                  <span>Min height (ft)</span>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    value={editingRide.min_height}
                    onChange={(e) => setEditingRide({ ...editingRide, min_height: Number(e.target.value) })}
                  />
                </label>
              </div>
              <label className="field">
                <span>Type</span>
                <select
                  value={editingRide.type}
                  onChange={(e) => setEditingRide({ ...editingRide, type: e.target.value })}
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
                  value={editingRide.status}
                  onChange={(e) => setEditingRide({ ...editingRide, status: e.target.value })}
                >
                  {RIDE_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="admin-edit-actions">
                <button type="button" className="btn-primary" onClick={() => void saveRideEdit()}>
                  Save ride
                </button>
                <button type="button" className="btn-ghost" onClick={() => setEditingRide(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ride</th>
                <th>Park</th>
                <th>Type</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r.ride_id}>
                  <td>{r.ride_id}</td>
                  <td>{r.name}</td>
                  <td>{r.park_name}</td>
                  <td>{r.type}</td>
                  <td>{r.status}</td>
                  <td>
                    <button type="button" className="btn-ghost btn-ghost--sm" onClick={() => setEditingRide({ ...r })}>
                      Edit
                    </button>{" "}
                    <button type="button" className="btn-ghost btn-ghost--sm" onClick={() => removeRide(r.ride_id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="admin-reset-note">
          Data is saved in this browser (
          <button type="button" className="admin-reset-link" onClick={() => resetPersistedDatabase()}>
            reset to seed data
          </button>
          ).
        </p>
      </motion.section>
    </div>
  );
}
