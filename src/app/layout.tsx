import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next PDF Generator",
  description: "Generate PDFs from any webpage URL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-background">
          <header className="border-b px-4">
            <div className="container mx-auto py-4">
              <h1 className="text-2xl font-bold">Next PDF Generator</h1>
            </div>
          </header>
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  );
}
