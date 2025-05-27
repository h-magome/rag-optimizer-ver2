import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from 'next/link';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RAG Optimizer",
  description: "ファイルアップロードとRAGシステム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <nav className="bg-white shadow-sm border-b border-gray-200 mb-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-lg font-semibold text-gray-800">
                  RAG Optimizer
                </Link>
                <div className="flex space-x-6">
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    ファイル一覧
                  </Link>
                  <Link
                    href="/upload"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    アップロード
                  </Link>
                  <Link
                    href="/chat"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    チャット
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
