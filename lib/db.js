import mysql from "mysql2/promise";

// Pool dibuat sekali saja (aman saat hot reload)
const db = (globalThis.dbTabungan ||= mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }, // wajib SSL di Aiven, tanpa ca.pem
  dateStrings: true,
}));
export default db;

// Buat tabel otomatis kalau belum ada (struktur sama dengan schema.sql)
let siap;
export function siapkan() {
  siap ||= (async () => {
    await db.query(`CREATE TABLE IF NOT EXISTS target_tabungan (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama_target VARCHAR(100) NOT NULL,
      deskripsi TEXT,
      target_nominal DECIMAL(15,2) NOT NULL,
      tanggal_mulai DATE NOT NULL,
      tanggal_selesai DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await db.query(`CREATE TABLE IF NOT EXISTS transaksi (
      id INT AUTO_INCREMENT PRIMARY KEY,
      target_id INT NOT NULL,
      jenis ENUM('setoran', 'penarikan') NOT NULL,
      jumlah DECIMAL(15,2) NOT NULL,
      keterangan VARCHAR(255),
      tanggal_transaksi DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_transaksi_target FOREIGN KEY (target_id) REFERENCES target_tabungan(id)
        ON UPDATE CASCADE ON DELETE CASCADE
    )`);
  })().catch((e) => { siap = null; throw e; });
  return siap;
}

// Total terkumpul untuk satu target
export async function terkumpul(targetId) {
  const [r] = await db.query(
    "SELECT COALESCE(SUM(IF(jenis='setoran', jumlah, -jumlah)), 0) AS s FROM transaksi WHERE target_id = ?",
    [targetId]
  );
  return Number(r[0].s);
}
