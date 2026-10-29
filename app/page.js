"use client";
import { useEffect, useState } from "react";

const rp = (n) => "Rp" + Number(n).toLocaleString("id-ID");
const targetKosong = { nama_target: "", target_nominal: "", tanggal_selesai: "", deskripsi: "" };

export default function Home() {
  const [targets, setTargets] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [pesan, setPesan] = useState("");
  const [t, setT] = useState(targetKosong);
  const [x, setX] = useState({ target_id: "", jumlah: "", keterangan: "" });

  async function muat() {
    const [a, b] = await Promise.all([fetch("/api/target"), fetch("/api/transaksi")]);
    if (!a.ok || !b.ok) return setPesan("Gagal terhubung ke database. Cek isi .env.local.");
    setTargets(await a.json());
    setRiwayat(await b.json());
  }
  useEffect(() => { muat(); }, []);

  async function kirim(url, method, body, reset) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body && JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    setPesan(res.ok ? "" : d.error || "Terjadi kesalahan.");
    if (res.ok && reset) reset();
    muat();
  }

  const total = targets.reduce((a, r) => a + r.terkumpul, 0);
  const pilih = x.target_id || targets[0]?.id || "";
  const transaksi = (jenis) =>
    kirim("/api/transaksi", "POST", { ...x, target_id: pilih, jenis }, () => setX({ ...x, jumlah: "", keterangan: "" }));

  return (
    <main>
      <p className="tengah">Total tabungan</p>
      <h1>{rp(total)}</h1>

      <div className="box">
        <h2>Target tabungan</h2>
        {targets.length === 0 && <p className="kecil">Belum ada target. Tambahkan di bawah.</p>}
        {targets.map((r) => {
          const p = r.target_nominal ? Math.min(100, Math.max(0, (r.terkumpul / r.target_nominal) * 100)) : 0;
          return (
            <div className="target" key={r.id}>
              <div className="item">
                <b>{r.nama_target}</b>
                <button className="hapus" onClick={() => confirm("Hapus target ini beserta semua transaksinya?") && kirim(`/api/target/${r.id}`, "DELETE")}>Hapus</button>
              </div>
              {r.deskripsi && <div className="kecil">{r.deskripsi}</div>}
              <div className="bar"><div style={{ width: (p > 0 ? Math.max(p, 2) : 0) + "%" }} /></div>
              <div className="kecil">
                {rp(r.terkumpul)} dari {rp(r.target_nominal)} ({p.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%)
                {r.tanggal_selesai && ` · sampai ${r.tanggal_selesai}`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="box">
        <h2>Tambah target</h2>
        <input placeholder="Nama target (misal: Beli laptop)" value={t.nama_target} onChange={(e) => setT({ ...t, nama_target: e.target.value })} />
        <input type="number" placeholder="Nominal target (Rp)" value={t.target_nominal} onChange={(e) => setT({ ...t, target_nominal: e.target.value })} />
        <input placeholder="Deskripsi (opsional)" value={t.deskripsi} onChange={(e) => setT({ ...t, deskripsi: e.target.value })} />
        <label className="kecil">Tanggal selesai (opsional)</label>
        <input type="date" value={t.tanggal_selesai} onChange={(e) => setT({ ...t, tanggal_selesai: e.target.value })} />
        <button className="penuh" onClick={() => kirim("/api/target", "POST", t, () => setT(targetKosong))}>Simpan target</button>
      </div>

      <div className="box">
        <h2>Setor / tarik</h2>
        <select value={pilih} onChange={(e) => setX({ ...x, target_id: e.target.value })}>
          {targets.length === 0 && <option value="">Belum ada target</option>}
          {targets.map((r) => <option key={r.id} value={r.id}>{r.nama_target}</option>)}
        </select>
        <input type="number" placeholder="Jumlah (Rp)" value={x.jumlah} onChange={(e) => setX({ ...x, jumlah: e.target.value })} />
        <input placeholder="Keterangan (opsional)" value={x.keterangan} onChange={(e) => setX({ ...x, keterangan: e.target.value })} />
        <div className="row">
          <button onClick={() => transaksi("setoran")}>Setor</button>
          <button className="merah" onClick={() => transaksi("penarikan")}>Tarik</button>
        </div>
        <p className="pesan">{pesan}</p>
      </div>

      <div className="box">
        <h2>Riwayat</h2>
        {riwayat.length === 0 && <p className="kecil">Belum ada transaksi.</p>}
        {riwayat.map((r) => (
          <div className="item" key={r.id}>
            <span>
              {r.nama_target} · {r.jenis}
              <div className="kecil">{r.tanggal_transaksi.slice(0, 10)}{r.keterangan && ` · ${r.keterangan}`}</div>
            </span>
            <span>
              <b className={r.jenis === "setoran" ? "hijau" : "merahteks"}>{r.jenis === "setoran" ? "+" : "−"}{rp(r.jumlah)}</b>
              <button className="hapus" onClick={() => kirim(`/api/transaksi/${r.id}`, "DELETE")}>Hapus</button>
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
