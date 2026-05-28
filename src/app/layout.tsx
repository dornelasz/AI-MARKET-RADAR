import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AI Market Radar",
  description:
    "Radar inteligente de mercado para acompanhar Inteligência Artificial em tempo real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="mx-auto min-h-screen w-full max-w-[1500px] lg:grid lg:grid-cols-[256px_1fr]">
          <Sidebar />
          <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
