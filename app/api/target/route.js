import { NextResponse } from "next/server";
import db, { siapkan } from "@/lib/db";

export const dynamic = "force-dynamic";

// Daftar target + total terkumpul tiap target
export async function GET() {
  await siapkan();
  const [rows] = await db.query(`
    SELECT t.*, COALESCE(SUM(IF(x.jenis='setoran', x.jumlah, -x.jumlah)), 0) AS terkumpul
    FROM target_tabungan t
    LEFT JOIN transaksi x ON x.target_id = t.id
    GROUP BY t.id
    ORDER BY t.id DESC`);
  return NextResponse.json(
    rows.map((r) => ({ ...r, target_nominal: Number(r.target_nominal), terkumpul: Number(r.terkumpul) }))
  );
}

// Tambah target baru
export async function POST(req) {
  await siapkan();
  const b = await req.json();
  const nominal = Number(b.target_nominal);
  if (!b.nama_target?.trim()) return NextResponse.json({ error: "Isi nama target dulu." }, { status: 400 });
  if (!(nominal > 0)) return NextResponse.json({ error: "Nominal target harus lebih dari nol." }, { status: 400 });
  await db.query(
    "INSERT INTO target_tabungan (nama_target, deskripsi, target_nominal, tanggal_mulai, tanggal_selesai) VALUES (?, ?, ?, CURDATE(), ?)",
    [b.nama_target.trim().slice(0, 100), b.deskripsi?.trim() || null, nominal, b.tanggal_selesai || null]
  );
  return NextResponse.json({ ok: true });
}
