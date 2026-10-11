import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Chave Direta", description: "Encontre, negocie e alugue direto com segurança.", other: { "codex-preview": "development" } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
