"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { label: "Upload", href: "#upload" },
    { label: "Dashboard", href: "#dashboard" },
    { label: "Analysis", href: "#charts" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-bg-primary/70 backdrop-blur-2xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group" data-magnetic>
          <div className="relative w-9 h-9 flex items-center justify-center rounded-lg overflow-hidden group-hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.2)] group-hover:shadow-[0_0_20px_rgba(225,29,72,0.3)] border border-white/5 bg-black">
            <img src="/logo.png" alt="Exam Pattern Analyzer Logo" className="w-full h-full object-cover scale-[1.2]" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Exam<span className="text-accent">Analyzer</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              data-magnetic
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors duration-300 rounded-lg hover:bg-white/[0.03]"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#upload"
            data-magnetic
            className="ml-3 px-4 py-2 text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-all duration-300"
          >
            Get Started
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-text-secondary hover:text-text-primary"
          data-magnetic
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-bg-secondary/95 backdrop-blur-2xl border-b border-border px-6 py-4 space-y-2"
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </motion.div>
      )}
    </motion.nav>
  );
}
