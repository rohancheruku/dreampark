import initSqlJs, { type Database, type QueryExecResult } from "sql.js";
import schemaSql from "../data/dreampark_schema.sql?raw";
import seedSql from "../data/dreampark_seed.sql?raw";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

/** Matches checkout / ticket flow for display (e.g. Home “price with tax”). */
export const DEFAULT_TAX_RATE = 0.08;

export function priceWithTax(base: number, taxRate: number = DEFAULT_TAX_RATE): number {
  return Math.round(base * (1 + taxRate) * 100) / 100;
}

const DB_STORAGE_KEY = "dreampark-sqlite-v1";

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function persistDatabase(db: Database): void {
  if (typeof localStorage === "undefined") return;
  try {
    const data = db.export();
    localStorage.setItem(DB_STORAGE_KEY, uint8ToBase64(data));
  } catch (e) {
    console.warn("Could not persist database to localStorage:", e);
  }
}

let dbPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await initSqlJs({ locateFile: () => wasmUrl });
      const saved =
        typeof localStorage !== "undefined" ? localStorage.getItem(DB_STORAGE_KEY) : null;
      if (saved) {
        try {
          const db = new SQL.Database(base64ToUint8(saved));
          return db;
        } catch {
          localStorage.removeItem(DB_STORAGE_KEY);
        }
      }
      const db = new SQL.Database();
      db.exec(schemaSql);
      db.exec(seedSql);
      persistDatabase(db);
      return db;
    })();
  }
  return dbPromise;
}

/** Clears saved DB and reloads the page so seed data is fresh. */
export function resetPersistedDatabase(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(DB_STORAGE_KEY);
  dbPromise = null;
  window.location.reload();
}

export function resultToObjects(result: QueryExecResult): Record<string, string | number | null>[] {
  if (!result.columns.length) return [];
  return result.values.map((row: (string | number | null | Uint8Array)[]) => {
    const obj: Record<string, string | number | null> = {};
    result.columns.forEach((col: string, i: number) => {
      const v = row[i];
      if (v instanceof Uint8Array) {
        obj[col] = null;
      } else {
        obj[col] = v === undefined ? null : v;
      }
    });
    return obj;
  });
}

export async function runQuery(sql: string): Promise<Record<string, string | number | null>[]> {
  const db = await getDb();
  const res = db.exec(sql);
  if (!res.length) return [];
  return resultToObjects(res[0]);
}

export type CheckoutLine = {
  themeParkId: number;
  type: string;
  price: number;
  duration: number;
  quantity: number;
};

function splitName(fullName: string): { first: string; last: string } {
  const t = fullName.trim();
  const i = t.indexOf(" ");
  if (i === -1) return { first: t || "Guest", last: "." };
  return { first: t.slice(0, i), last: t.slice(i + 1).trim() || "." };
}

export async function checkoutOrder(input: {
  fullName: string;
  email: string;
  lines: CheckoutLine[];
  taxRate?: number;
}): Promise<{ totalTickets: number; subtotal: number; tax: number; total: number }> {
  const db = await getDb();
  const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
  const { first, last } = splitName(input.fullName);

  let visitorId: number;
  const findVisitor = db.prepare("SELECT visitor_id FROM visitor WHERE email = ?");
  findVisitor.bind([input.email.trim()]);
  if (findVisitor.step()) {
    visitorId = Number(findVisitor.getAsObject().visitor_id);
  } else {
    db.run("INSERT INTO visitor (first_name, last_name, email) VALUES (?, ?, ?)", [
      first,
      last,
      input.email.trim(),
    ]);
    const vidRow = db.exec("SELECT last_insert_rowid() AS id");
    visitorId = Number(vidRow[0].values[0][0]);
  }
  findVisitor.free();

  let lastTicketId: number | null = null;
  let ticketCount = 0;
  for (const line of input.lines) {
    for (let q = 0; q < line.quantity; q++) {
      db.run(
        "INSERT INTO ticket (type, theme_park_id, price, duration, visitor_id) VALUES (?, ?, ?, ?, ?)",
        [line.type, line.themeParkId, line.price, line.duration, visitorId],
      );
      const tidRow = db.exec("SELECT last_insert_rowid() AS id");
      lastTicketId = Number(tidRow[0].values[0][0]);
      db.run("INSERT INTO ticket_theme_park (ticket_id, theme_park_id) VALUES (?, ?)", [
        lastTicketId,
        line.themeParkId,
      ]);
      ticketCount += 1;
    }
  }

  if (lastTicketId !== null) {
    db.run("UPDATE visitor SET ticket_id = ? WHERE visitor_id = ?", [lastTicketId, visitorId]);
  }

  const subtotal = input.lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  notifyDbChanged();
  return { totalTickets: ticketCount, subtotal, tax, total };
}

export const DB_CHANGED_EVENT = "dreampark-db-changed";

export function notifyDbChanged() {
  if (typeof window === "undefined") return;
  void getDb()
    .then((db) => {
      persistDatabase(db);
    })
    .catch(() => {})
    .finally(() => {
      window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
    });
}

export function onDbChanged(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(DB_CHANGED_EVENT, handler);
  return () => window.removeEventListener(DB_CHANGED_EVENT, handler);
}

export type PresentCustomer = {
  visitor_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  ticket_id: number;
  ticket_type: string;
  park_name: string;
  ticket_price: number;
};

export async function fetchPresentCustomers(): Promise<PresentCustomer[]> {
  const rows = await runQuery(`
    SELECT
      v.visitor_id,
      v.first_name,
      v.last_name,
      v.email,
      t.ticket_id,
      t.type AS ticket_type,
      tp.name AS park_name,
      t.price AS ticket_price
    FROM visitor v
    JOIN ticket t ON t.ticket_id = v.ticket_id
    JOIN theme_park tp ON tp.theme_park_id = t.theme_park_id
    ORDER BY t.ticket_id DESC
  `);
  return rows.map((r) => ({
    visitor_id: Number(r.visitor_id),
    first_name: String(r.first_name),
    last_name: String(r.last_name),
    email: r.email === null ? null : String(r.email),
    ticket_id: Number(r.ticket_id),
    ticket_type: String(r.ticket_type),
    park_name: String(r.park_name),
    ticket_price: Number(r.ticket_price),
  }));
}

const MEMBERSHIP_PRICES: Record<string, number> = {
  Basic: 99.99,
  Premium: 179.99,
  Family: 299.99,
};

function premiumCompanionParkId(db: Database, primaryId: number): number | null {
  const maxRow = db.exec("SELECT MAX(theme_park_id) AS m FROM theme_park");
  const maxId = maxRow[0]?.values[0]?.[0];
  const globalMax = maxId === undefined || maxId === null ? primaryId : Number(maxId);
  const sql =
    primaryId === globalMax
      ? "SELECT MIN(theme_park_id) AS x FROM theme_park WHERE theme_park_id <> ?"
      : "SELECT MAX(theme_park_id) AS x FROM theme_park WHERE theme_park_id <> ?";
  const st = db.prepare(sql);
  st.bind([primaryId]);
  if (!st.step()) {
    st.free();
    return null;
  }
  const row = st.getAsObject();
  st.free();
  const v = row.x;
  return v === undefined || v === null ? null : Number(v);
}

function membershipParkIds(db: Database, type: string, primaryId: number): number[] {
  const allStmt = db.prepare("SELECT theme_park_id FROM theme_park ORDER BY theme_park_id");
  const all: number[] = [];
  while (allStmt.step()) {
    all.push(Number(allStmt.getAsObject().theme_park_id));
  }
  allStmt.free();

  if (type === "Family") return all;

  if (type === "Basic") {
    const extra = db.exec(
      "SELECT MIN(theme_park_id) AS x FROM theme_park WHERE theme_park_id <> " + String(primaryId),
    );
    const ex =
      extra[0]?.values[0]?.[0] === undefined || extra[0]?.values[0]?.[0] === null
        ? null
        : Number(extra[0].values[0][0]);
    const set = new Set<number>([primaryId]);
    if (ex !== null) set.add(ex);
    return [...set].sort((a, b) => a - b);
  }

  if (type === "Premium") {
    const extra = premiumCompanionParkId(db, primaryId);
    const set = new Set<number>([primaryId]);
    if (extra !== null) set.add(extra);
    return [...set].sort((a, b) => a - b);
  }

  return [primaryId];
}

export async function purchaseMembership(input: {
  fullName: string;
  email: string;
  type: "Basic" | "Premium" | "Family";
  themeParkId: number;
  numGuests: number;
}): Promise<{ membershipId: number; total: number }> {
  const db = await getDb();
  const price = MEMBERSHIP_PRICES[input.type];
  if (price === undefined) throw new Error("Invalid membership type");

  if (input.type === "Basic" && input.numGuests !== 1) {
    throw new Error("Basic membership covers 1 guest.");
  }
  if (input.type === "Premium" && (input.numGuests < 1 || input.numGuests > 2)) {
    throw new Error("Premium membership allows 1–2 guests.");
  }
  if (input.type === "Family" && (input.numGuests < 2 || input.numGuests > 8)) {
    throw new Error("Family membership allows 2–8 guests on the plan.");
  }

  const { first, last } = splitName(input.fullName);
  const email = input.email.trim();
  const today = new Date().toISOString().slice(0, 10);

  let visitorId: number;
  const findVisitor = db.prepare("SELECT visitor_id FROM visitor WHERE email = ?");
  findVisitor.bind([email]);
  if (findVisitor.step()) {
    visitorId = Number(findVisitor.getAsObject().visitor_id);
  } else {
    db.run("INSERT INTO visitor (first_name, last_name, email) VALUES (?, ?, ?)", [first, last, email]);
    const vidRow = db.exec("SELECT last_insert_rowid() AS id");
    visitorId = Number(vidRow[0].values[0][0]);
  }
  findVisitor.free();

  const findMem = db.prepare("SELECT membership_id FROM membership WHERE visitor_id = ?");
  findMem.bind([visitorId]);
  let membershipId: number;
  if (findMem.step()) {
    membershipId = Number(findMem.getAsObject().membership_id);
    db.run(
      "UPDATE membership SET type = ?, price = ?, date_started = ?, num_guests = ?, theme_park_id = ? WHERE membership_id = ?",
      [input.type, price, today, input.numGuests, input.themeParkId, membershipId],
    );
    db.run("DELETE FROM membership_theme_park WHERE membership_id = ?", [membershipId]);
  } else {
    db.run(
      "INSERT INTO membership (type, price, date_started, num_guests, visitor_id, theme_park_id) VALUES (?, ?, ?, ?, ?, ?)",
      [input.type, price, today, input.numGuests, visitorId, input.themeParkId],
    );
    const midRow = db.exec("SELECT last_insert_rowid() AS id");
    membershipId = Number(midRow[0].values[0][0]);
    db.run("UPDATE visitor SET membership_id = ? WHERE visitor_id = ?", [membershipId, visitorId]);
  }
  findMem.free();

  const parkIds = membershipParkIds(db, input.type, input.themeParkId);
  for (const pid of parkIds) {
    db.run("INSERT INTO membership_theme_park (membership_id, theme_park_id) VALUES (?, ?)", [membershipId, pid]);
  }

  notifyDbChanged();
  return { membershipId, total: price };
}

function syncRideCounts(db: Database) {
  db.run(`
    UPDATE theme_park SET number_of_rides = (
      SELECT COUNT(*) FROM ride r WHERE r.theme_park_id = theme_park.theme_park_id
    )
  `);
}

export async function adminAddThemePark(input: { name: string; location: string }): Promise<number> {
  const db = await getDb();
  const maxRow = db.exec("SELECT COALESCE(MAX(theme_park_id), 0) + 1 AS id FROM theme_park");
  const id = Number(maxRow[0].values[0][0]);
  db.run("INSERT INTO theme_park (theme_park_id, name, location, number_of_rides) VALUES (?, ?, ?, 1)", [
    id,
    input.name.trim(),
    input.location.trim() || "TBA",
  ]);
  db.run(
    `INSERT INTO ride (name, duration, capacity, theme_park_id, type, min_height, status)
     VALUES (?, 5, 20, ?, 'Carousel', 0, 'Construction')`,
    [`${input.name.trim()} — hub`, id],
  );
  syncRideCounts(db);
  notifyDbChanged();
  return id;
}

export async function adminDeleteThemePark(themeParkId: number): Promise<void> {
  const db = await getDb();
  const dep = db.exec("SELECT COUNT(*) AS c FROM department WHERE theme_park_id = " + String(themeParkId));
  const depCount = dep.length ? Number(dep[0].values[0][0]) : 0;
  if (depCount > 0) {
    throw new Error(
      "This park has departments linked in the seed data. Remove rides from parks you added in admin, or use a park with no departments.",
    );
  }

  const rideIdsRes = db.exec("SELECT ride_id FROM ride WHERE theme_park_id = " + String(themeParkId));
  const rideIds: number[] = [];
  if (rideIdsRes[0]) {
    for (const row of rideIdsRes[0].values) {
      if (row[0] !== undefined && row[0] !== null) rideIds.push(Number(row[0]));
    }
  }
  for (const rid of rideIds) {
    db.run("DELETE FROM ride_wait_snapshots WHERE ride_id = ?", [rid]);
  }
  db.run("DELETE FROM ride WHERE theme_park_id = ?", [themeParkId]);

  db.run(
    "UPDATE visitor SET ticket_id = NULL WHERE ticket_id IN (SELECT ticket_id FROM ticket WHERE theme_park_id = ?)",
    [themeParkId],
  );
  db.run("DELETE FROM ticket_theme_park WHERE ticket_id IN (SELECT ticket_id FROM ticket WHERE theme_park_id = ?)", [
    themeParkId,
  ]);
  db.run("DELETE FROM ticket_theme_park WHERE theme_park_id = ?", [themeParkId]);
  db.run("DELETE FROM ticket WHERE theme_park_id = ?", [themeParkId]);

  db.run("DELETE FROM membership_theme_park WHERE theme_park_id = ?", [themeParkId]);
  db.run("UPDATE membership SET theme_park_id = NULL WHERE theme_park_id = ?", [themeParkId]);

  db.run("DELETE FROM department_theme_park WHERE theme_park_id = ?", [themeParkId]);
  db.run("UPDATE department SET theme_park_id = NULL WHERE theme_park_id = ?", [themeParkId]);

  db.run("DELETE FROM theme_park WHERE theme_park_id = ?", [themeParkId]);
  notifyDbChanged();
}

export async function adminAddRide(input: {
  themeParkId: number;
  name: string;
  duration: number;
  capacity: number;
  type: string;
  minHeight: number;
  status: string;
}): Promise<number> {
  const db = await getDb();
  db.run(
    `INSERT INTO ride (name, duration, capacity, theme_park_id, type, min_height, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name.trim(),
      input.duration,
      input.capacity,
      input.themeParkId,
      input.type,
      input.minHeight,
      input.status,
    ],
  );
  const ridRow = db.exec("SELECT last_insert_rowid() AS id");
  const rideId = Number(ridRow[0].values[0][0]);
  syncRideCounts(db);
  notifyDbChanged();
  return rideId;
}

export async function adminDeleteRide(rideId: number): Promise<void> {
  const db = await getDb();
  const parkRow = db.exec("SELECT theme_park_id FROM ride WHERE ride_id = " + String(rideId));
  if (!parkRow.length || !parkRow[0].values.length) {
    throw new Error("Ride not found.");
  }
  const themeParkId = Number(parkRow[0].values[0][0]);

  const cntRow = db.exec("SELECT COUNT(*) FROM ride WHERE theme_park_id = " + String(themeParkId));
  const cnt = Number(cntRow[0].values[0][0]);
  if (cnt <= 1) {
    throw new Error("Each park must keep at least one ride. Add another ride before removing this one.");
  }

  db.run("DELETE FROM ride_wait_snapshots WHERE ride_id = ?", [rideId]);
  db.run("DELETE FROM ride_schedule WHERE ride_id = ?", [rideId]);
  db.run("DELETE FROM ride WHERE ride_id = ?", [rideId]);
  syncRideCounts(db);
  notifyDbChanged();
}

export async function adminUpdateRide(input: {
  rideId: number;
  name: string;
  duration: number;
  capacity: number;
  type: string;
  minHeight: number;
  status: string;
}): Promise<void> {
  const db = await getDb();
  db.run(
    `UPDATE ride SET name = ?, duration = ?, capacity = ?, type = ?, min_height = ?, status = ?
     WHERE ride_id = ?`,
    [
      input.name.trim(),
      input.duration,
      input.capacity,
      input.type,
      input.minHeight,
      input.status,
      input.rideId,
    ],
  );
  notifyDbChanged();
}

export async function adminSetDepartmentHead(departmentId: number, employeeId: number | null): Promise<void> {
  const db = await getDb();
  if (employeeId !== null) {
    const chk = db.exec(
      "SELECT department_id FROM employee WHERE employee_id = " +
        String(employeeId) +
        " AND department_id = " +
        String(departmentId),
    );
    if (!chk.length || !chk[0].values.length) {
      throw new Error("That employee is not in this department.");
    }
  }
  db.run("UPDATE department SET dept_head_id = ? WHERE department_id = ?", [employeeId, departmentId]);
  notifyDbChanged();
}

export async function adminUpdateEmployee(input: {
  employeeId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  salary: number;
  address: string;
}): Promise<void> {
  const db = await getDb();
  db.run(
    "UPDATE employee SET first_name = ?, last_name = ?, phone_number = ?, salary = ?, address = ? WHERE employee_id = ?",
    [
      input.firstName.trim(),
      input.lastName.trim(),
      input.phoneNumber.trim(),
      input.salary,
      input.address.trim(),
      input.employeeId,
    ],
  );
  notifyDbChanged();
}

export async function adminFireEmployee(employeeId: number): Promise<void> {
  const db = await getDb();
  db.run("UPDATE department SET dept_head_id = NULL WHERE dept_head_id = ?", [employeeId]);
  db.run("DELETE FROM employee WHERE employee_id = ?", [employeeId]);
  db.run(`
    UPDATE department AS d SET num_employees = (
      SELECT COUNT(*) FROM employee e WHERE e.department_id = d.department_id
    )
  `);
  notifyDbChanged();
}

export type MembershipRow = {
  membership_id: number;
  type: string;
  price: number;
  num_guests: number;
  date_started: string;
  first_name: string;
  last_name: string;
  email: string | null;
  park_name: string | null;
};

export async function fetchMembershipRows(): Promise<MembershipRow[]> {
  const rows = await runQuery(`
    SELECT
      m.membership_id,
      m.type,
      m.price,
      m.num_guests,
      m.date_started,
      v.first_name,
      v.last_name,
      v.email,
      tp.name AS park_name
    FROM membership m
    JOIN visitor v ON v.visitor_id = m.visitor_id
    LEFT JOIN theme_park tp ON tp.theme_park_id = m.theme_park_id
    ORDER BY m.membership_id
  `);
  return rows.map((r) => ({
    membership_id: Number(r.membership_id),
    type: String(r.type),
    price: Number(r.price),
    num_guests: Number(r.num_guests),
    date_started: String(r.date_started),
    first_name: String(r.first_name),
    last_name: String(r.last_name),
    email: r.email === null ? null : String(r.email),
    park_name: r.park_name === null ? null : String(r.park_name),
  }));
}
