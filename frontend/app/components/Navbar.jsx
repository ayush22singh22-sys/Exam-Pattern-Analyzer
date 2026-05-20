"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Menu, X, Settings, Wifi, WifiOff, RefreshCw, Check, AlertTriangle, Link, Info } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const { apiUrl, updateApiUrl } = useAnalysis();
  const [apiStatus, setApiStatus] = useState("checking"); // 'online', 'offline', 'checking'
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [pinging, setPinging] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }

  const checkStatus = async (urlToCheck = apiUrl) => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500); // 3.5 sec timeout
      
      const response = await fetch(`${urlToCheck}/`, { 
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(id);
      
      if (response.ok) {
        setApiStatus("online");
        return true;
      }
    } catch (e) {
      // silence
    }
    setApiStatus("offline");
    return false;
  };

  useEffect(() => {
    checkStatus(apiUrl);
    const interval = setInterval(() => checkStatus(apiUrl), 15000); // ping every 15s
    return () => clearInterval(interval);
  }, [apiUrl]);

  useEffect(() => {
    setInputUrl(apiUrl);
  }, [apiUrl]);

  const testConnection = async () => {
    setPinging(true);
    setTestResult(null);
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000);
      
      let formatted = inputUrl.trim();
      if (formatted.endsWith("/")) {
        formatted = formatted.slice(0, -1);
      }
      
      const res = await fetch(`${formatted}/`, {
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(id);
      
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: data.message || "Successfully connected to FastAPI!"
        });
      } else {
        setTestResult({
          success: false,
          message: `Connection failed with status ${res.status}.`
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: "Unable to connect. Make sure your backend server is running and CORS is enabled."
      });
    } finally {
      setPinging(false);
    }
  };

  const handleSave = () => {
    let formatted = inputUrl.trim();
    if (formatted.endsWith("/")) {
      formatted = formatted.slice(0, -1);
    }
    updateApiUrl(formatted);
    setSettingsOpen(false);
    setTestResult(null);
  };

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
    <>
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
          <div className="hidden md:flex items-center gap-2">
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

            {/* Connection Status Capsule */}
            <button
              onClick={() => setSettingsOpen(true)}
              data-magnetic
              className={`flex items-center gap-1.5 px-3.5 py-1.5 ml-2 rounded-full glass-card border border-white/5 transition-all duration-300 ${
                apiStatus === "online" 
                  ? "bg-green-500/5 hover:bg-green-500/10 border-green-500/10 hover:border-green-500/20" 
                  : "bg-red-500/5 hover:bg-red-500/10 border-red-500/10 hover:border-red-500/20"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {apiStatus === "online" && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </>
                )}
                {apiStatus === "offline" && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </>
                )}
                {apiStatus === "checking" && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse"></span>
                )}
              </span>
              <span className={`text-[11px] font-semibold tracking-wide uppercase ${
                apiStatus === "online" ? "text-green-400" : apiStatus === "offline" ? "text-red-400" : "text-amber-400"
              }`}>
                {apiStatus === "online" ? "Server Active" : apiStatus === "offline" ? "Server Offline" : "Syncing..."}
              </span>
              <Settings size={12} className="text-text-muted hover:text-text-primary ml-0.5 transition-colors" />
            </button>

            <a
              href="#upload"
              data-magnetic
              className="ml-3 px-4 py-2 text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-all duration-300"
            >
              Get Started
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setSettingsOpen(true)}
              className={`p-2 rounded-lg border border-white/5 ${
                apiStatus === "online" ? "bg-green-500/5 border-green-500/10" : "bg-red-500/5 border-red-500/10"
              }`}
            >
              <Settings size={18} className={apiStatus === "online" ? "text-green-400 animate-pulse" : "text-red-400"} />
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-text-secondary hover:text-text-primary"
              data-magnetic
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
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
            
            {/* Mobile Status Row */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 mt-3 pt-3">
              <span className="text-xs text-text-muted">Connection Status:</span>
              <button 
                onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  apiStatus === "online" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {apiStatus === "online" ? "API Online" : "API Offline"}
                <Settings size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Glassmorphic Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg glass-card-strong rounded-3xl p-8 border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* JJK Cursed Aura subtle bg */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-purple-600/10 to-transparent rounded-full filter blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-44 h-44 bg-gradient-to-tr from-rose-600/10 to-transparent rounded-full filter blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setSettingsOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors duration-200"
              >
                <X size={16} />
              </button>

              {/* Modal Header */}
              <div className="mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-rose-600 flex items-center justify-center text-white shadow-lg">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Sync Settings</h3>
                  <p className="text-xs text-text-muted">Connect your exam analyzer frontend to the predictive API</p>
                </div>
              </div>

              {/* Health Indicator Card */}
              <div className={`mb-6 p-4 rounded-2xl border transition-all duration-300 ${
                apiStatus === "online" 
                  ? "bg-green-500/[0.03] border-green-500/20" 
                  : "bg-red-500/[0.03] border-red-500/20"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      apiStatus === "online" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {apiStatus === "online" ? <Wifi size={16} /> : <WifiOff size={16} />}
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider block text-text-muted">Server Status</span>
                      <span className={`text-sm font-bold ${apiStatus === "online" ? "text-green-400" : "text-red-400"}`}>
                        {apiStatus === "online" ? "Successfully Connected (API Live)" : "Disconnected (Offline)"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => checkStatus(apiUrl)}
                    className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-all duration-200"
                    title="Refresh connection status"
                  >
                    <RefreshCw size={14} className={apiStatus === "checking" ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* Endpoint Input */}
              <div className="mb-6 space-y-2">
                <label className="text-xs font-semibold text-text-primary block uppercase tracking-wider">
                  FastAPI Server Endpoint URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="e.g., http://127.0.0.1:8000"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-purple-500 focus:bg-white/[0.05] transition-all duration-300 font-mono"
                  />
                  <button
                    onClick={testConnection}
                    disabled={pinging || !inputUrl}
                    className="absolute right-2 top-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-text-secondary hover:text-text-primary font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {pinging ? "Pinging..." : "Test Ping"}
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex gap-2 pt-1.5">
                  <button
                    onClick={() => setInputUrl("http://127.0.0.1:8000")}
                    className="px-3 py-1 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs text-text-muted hover:text-text-secondary transition-all"
                  >
                    Localhost (Port 8000)
                  </button>
                  <button
                    onClick={() => {
                      if (apiUrl.includes("onrender.com")) {
                        setInputUrl(apiUrl);
                      } else {
                        // Ask user to input their custom URL
                        setInputUrl("https://exam-pattern-backend.onrender.com");
                      }
                    }}
                    className="px-3 py-1 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs text-text-muted hover:text-text-secondary transition-all"
                  >
                    Render Live Server
                  </button>
                </div>
              </div>

              {/* Test Result Message */}
              <AnimatePresence>
                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-3.5 mb-6 rounded-xl border text-xs flex gap-2.5 items-start ${
                      testResult.success 
                        ? "bg-green-500/5 border-green-500/10 text-green-300" 
                        : "bg-red-500/5 border-red-500/10 text-red-300"
                    }`}
                  >
                    {testResult.success ? (
                      <Check size={14} className="flex-shrink-0 mt-0.5 text-green-400" />
                    ) : (
                      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-red-400" />
                    )}
                    <span>{testResult.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mini Deployment Guide */}
              <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3">
                <Info size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-text-primary">Want to run it live over the internet?</h4>
                  <p className="text-[11px] leading-relaxed text-text-muted">
                    Your Next.js frontend is deployed live on Netlify! To deploy your FastAPI backend for free, create a web service on <a href="https://render.com" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">Render</a>, link your GitHub repository, choose <b>Python</b>, and set the start command to:
                    <code className="block bg-black/40 text-purple-300/80 px-2 py-1 rounded mt-1.5 font-mono text-[10px] border border-white/5">
                      uvicorn api:app --host 0.0.0.0 --port $PORT
                    </code>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 border-t border-white/5 pt-5">
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="flex-1 py-3 text-sm font-semibold rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-text-secondary hover:text-text-primary transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 text-sm font-bold rounded-xl jjk-gradient-btn flex items-center justify-center gap-2 shadow-lg"
                >
                  Save Connection
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
