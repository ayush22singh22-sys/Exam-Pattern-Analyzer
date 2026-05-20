"use client";

import { createContext, useState, useContext, useEffect } from "react";

const AnalysisContext = createContext();

export function AnalysisProvider({ children }) {
  const [analysisData, setAnalysisData] = useState(null);
  const [apiUrl, setApiUrl] = useState("http://127.0.0.1:8000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("API_URL");
      if (stored) {
        setApiUrl(stored);
      }
    }
  }, []);

  const updateApiUrl = (newUrl) => {
    let formatted = newUrl.trim();
    // Strip trailing slash if present
    if (formatted.endsWith("/")) {
      formatted = formatted.slice(0, -1);
    }
    setApiUrl(formatted);
    if (typeof window !== "undefined") {
      localStorage.setItem("API_URL", formatted);
    }
  };

  return (
    <AnalysisContext.Provider value={{ analysisData, setAnalysisData, apiUrl, updateApiUrl }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  return useContext(AnalysisContext);
}
