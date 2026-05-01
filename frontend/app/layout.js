import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import JJKBackground from "./components/JJKBackground";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Exam Pattern Analyzer — Predict What Matters",
  description:
    "AI-powered exam pattern analysis. Upload previous year papers, discover trending topics, and predict what's coming next.",
  keywords: ["exam analyzer", "topic prediction", "PYQ analysis", "RGPV"],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-bg-primary text-text-primary">
        <JJKBackground />
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
