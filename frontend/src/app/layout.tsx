import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Ecommerce Platform",
  description: "Modern ecommerce platform with dynamic products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
        </AuthProvider>
        {children}
      </body>
    </html>
  );
}
