"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Repeat,
  Scale,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";

const TABS = [
  { id: "repeated", label: "Most Repeated", icon: Repeat },
  { id: "weightage", label: "Chapter Weightage", icon: Scale },
  { id: "predictions", label: "Predictions", icon: Lightbulb },
];

// Mocks removed. We now show an empty placeholder state until analysisData is available.

export default function TabsSection() {
  const [activeTab, setActiveTab] = useState("repeated");
  const { analysisData } = useAnalysis();

  const hasData = !!(analysisData && analysisData.predictions && analysisData.top_topics);

  // Dynamically map data if available
  let repeatedData = [];
  let weightageData = [];
  let predictionData = [];

  if (hasData) {
    // REPEATED: sorted by appearances or total_hits
    repeatedData = analysisData.top_topics.slice(0, 10).map((t) => {
      // Find trend from predictions
      const p = analysisData.predictions.find((pred) => pred.chapter === t.chapter);
      const trendStr = p ? p.trend : "Stable";
      return {
        topic: t.chapter,
        count: t.total_hits,
        trend: trendStr.toLowerCase() === "increasing" ? "trending" : trendStr.toLowerCase() === "decreasing" ? "fading" : "stable"
      };
    });

    // WEIGHTAGE: map total hits and pct from top_topics
    const totalHits = analysisData.top_topics.reduce((sum, t) => sum + t.total_hits, 0);
    weightageData = analysisData.top_topics.map(t => ({
      chapter: t.chapter,
      unit1: "-", // Dynamic unit matching not available from simple API
      unit3: "-",
      total: t.total_hits,
      pct: totalHits > 0 ? parseFloat(((t.total_hits / totalHits) * 100).toFixed(2)) : 0
    })).filter(t => t.total > 0).slice(0, 15);

    // PREDICTIONS
    // Sort by predicted_next_year or High prediction
    const sortedPreds = [...analysisData.predictions].sort((a,b) => b.predicted_next_year - a.predicted_next_year);
    predictionData = sortedPreds.slice(0, 8).map(p => {
      // Normalize next year prediction to a pseudo-confidence score for UI purposes (capped at 99)
      const baseConf = p.prediction === "High" ? 85 : p.prediction === "Medium" ? 70 : 50;
      const confCalc = Math.min(99, Math.floor(baseConf + p.predicted_next_year * 2));
      return {
        topic: p.chapter,
        confidence: confCalc,
        reason: `Based on AI linear trend forecasting, appearances are ${p.trend.toLowerCase()} with an expected ${p.predicted_next_year.toFixed(1)} keyword hits globally next year.`
      };
    });
  }

  return (
    <section id="tabs" className="relative py-28 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Deep Analysis
          </h2>
          <p className="text-text-secondary text-sm max-w-lg mx-auto">
            Switch between views to explore repeated topics, chapter weightage,
            and AI-powered predictions.
          </p>
        </motion.div>

        {/* Tab Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-1 mb-10 p-1 glass-card rounded-xl w-fit mx-auto"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-magnetic
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-text-primary bg-accent/10"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <tab.icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-lg border border-accent/20"
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {!hasData ? (
             <motion.div
               key="empty-state"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.35 }}
               className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-white/[0.01]"
             >
               <div className="w-12 h-12 mb-4 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted">
                 <Lightbulb size={20} />
               </div>
               <h4 className="text-sm font-semibold mb-1">No analysis data yet</h4>
               <p className="text-xs text-text-muted">Upload a paper to see predictive insights and rankings.</p>
             </motion.div>
          ) : activeTab === "repeated" ? (
            <motion.div
              key="repeated"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="glass-card-strong overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        #
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Topic
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Hits
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {repeatedData.map((item, i) => (
                      <tr
                        key={item.topic + i}
                        className="border-b border-border/50 hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-text-muted font-mono">
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {item.topic}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary font-mono">
                          {item.count}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge badge-${item.trend}`}>
                            {item.trend === "trending" && "🔺 Trending"}
                            {item.trend === "stable" && "➡ Stable"}
                            {item.trend === "fading" && "🔻 Fading"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : activeTab === "weightage" ? (
            <motion.div
              key="weightage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="glass-card-strong overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Chapter
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Unit 1
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Unit 3
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Total
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Weight
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightageData.map((item, i) => (
                      <tr
                        key={item.chapter + i}
                        className="border-b border-border/50 hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium">
                          {item.chapter}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary text-center font-mono">
                          {item.unit1}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary text-center font-mono">
                          {item.unit3}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-primary text-center font-bold font-mono">
                          {item.total}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-accent">
                            {item.pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : activeTab === "predictions" ? (
            <motion.div
              key="predictions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              {predictionData.map((item, i) => (
                <motion.div
                  key={item.topic + i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card-strong p-6 group hover:border-border-hover transition-smooth"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Lightbulb
                          size={16}
                          className="text-white flex-shrink-0"
                        />
                        <h4 className="text-sm font-semibold">{item.topic}</h4>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed pl-7">
                        {item.reason}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-2xl font-bold gradient-text-accent">
                        {item.confidence}%
                      </span>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider">
                        confidence
                      </span>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="mt-4 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.confidence}%` }}
                      transition={{
                        duration: 1.2,
                        delay: 0.3 + i * 0.1,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      viewport={{ once: true }}
                      className="h-full rounded-full bg-gradient-to-r from-white/80 to-white/30"
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
