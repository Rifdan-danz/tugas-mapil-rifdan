import { NextResponse } from "next/server";
import db, { siapkan, terkumpul } from "@/lib/db";

export const dynamic = "force-dynamic";

// Riwayat semua transaksi
export async function GET() {
  await siapkan();
  const [rows] = await db.query(`
    SELECT x.*, t.nama_target
    FROM transaksi x JOIN target_tabungan t ON t.id = x.target_id
    ORDER BY x.id DESC`);
  return NextResponse.json(rows.map((r) => ({ ...r, jumlah: Number(r.jumlah) })));
}

// Setoran atau penarikan
export async function POST(req) {
  await siapkan();
  const b = await req.json();
  const jumlah = Number(b.jumlah);
  if (!b.target_id) return NextResponse.json({ error: "Pilih target dulu." }, { status: 400 });
  if (!["setoran", "penarikan"].includes(b.jenis)) return NextResponse.json({ error: "Jenis tidak valid." }, { status: 400 });
  if (!(jumlah > 0)) return NextResponse.json({ error: "Isi jumlah dulu." }, { status: 400 });
  if (b.jenis === "penarikan" && jumlah > (await terkumpul(b.target_id))) {
    return NextResponse.json({ error: "Saldo target ini tidak cukup." }, { status: 400 });
  }
  await db.query("INSERT INTO transaksi (target_id, jenis, jumlah, keterangan) VALUES (?, ?, ?, ?)", [
    b.target_id, b.jenis, jumlah, b.keterangan?.trim().slice(0, 255) || null,
  ]);
  return NextResponse.json({ ok: true });
}
