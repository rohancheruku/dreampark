import initSqlJs, { type Database, type QueryExecResult } from "sql.js";
import schemaSql from "../data/dreampark_schema.sql?raw";
import seedSql from "../data/dreampark_seed.sql?raw";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

let dbPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await initSqlJs({ locateFile: () => wasmUrl });
      const db = new SQL.Database();
      db.exec(schemaSql);
      db.exec(seedSql);
      return db;
    })();
  }
  return dbPromise;
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
  const taxRate = input.taxRate ?? 0.08;
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

  return { totalTickets: ticketCount, subtotal, tax, total };
}
