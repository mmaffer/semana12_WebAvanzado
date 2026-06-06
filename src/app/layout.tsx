import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biblioteca Digital",
  description: "Sistema de gestión de biblioteca",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-8">
            <Link href="/" className="font-bold text-lg text-blue-600">
              Biblioteca Digital
            </Link>
            <div className="flex gap-6">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/books"
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Libros
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
