import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CVzume",
  description: "AI-driven CV & Personligt Brev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html style={{ margin: 0, padding: 0 }}>
      <body style={{ margin: 0, padding: 0, width: "100vw", height: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
