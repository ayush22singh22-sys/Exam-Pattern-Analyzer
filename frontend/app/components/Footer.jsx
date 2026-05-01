"use client";

import { Cpu } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-accent/60" />
          <span className="text-xs text-text-muted">
            Exam Pattern Analyzer — Built with Python + Next.js
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs text-text-muted">
            CS-404 • Computer Organization & Architecture
          </span>
        </div>
      </div>
    </footer>
  );
}
