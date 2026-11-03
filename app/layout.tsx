import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Furkan Petshop | Command Center",
  description: "Özel stok, satış ve operasyon yönetim merkezi"
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
