import "./global.css";

export const metadata = { title: "Tabunganku" };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
