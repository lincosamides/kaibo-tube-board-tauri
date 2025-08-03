import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaibo's Private Tube Board",
  description: "A private board for Kaibo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased bg-black`}
      >
        {children}
      </body>
    </html>
  );
}
