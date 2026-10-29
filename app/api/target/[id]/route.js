import { NextResponse } from "next/server";
import db, { siapkan } from "@/lib/db";

// Hapus target (transaksinya ikut terhapus karena ON DELETE CASCADE)
export async function DELETE(req, { params }) {
  await siapkan();
  await db.query("DELETE FROM target_tabungan WHERE id = ?", [params.id]);
  return NextResponse.json({ ok: true });
}
