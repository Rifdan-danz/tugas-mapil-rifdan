import { NextResponse } from "next/server";
import db, { siapkan, terkumpul } from "@/lib/db";

// Hapus satu transaksi
export async function DELETE(req, { params }) {
  await siapkan();
  const [r] = await db.query("SELECT target_id, jenis, jumlah FROM transaksi WHERE id = ?", [params.id]);
  if (!r.length) return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
  if (r[0].jenis === "setoran" && (await terkumpul(r[0].target_id)) - Number(r[0].jumlah) < 0) {
    return NextResponse.json({ error: "Saldo target akan minus. Hapus penarikan dulu." }, { status: 400 });
  }
  await db.query("DELETE FROM transaksi WHERE id = ?", [params.id]);
  return NextResponse.json({ ok: true });
}
