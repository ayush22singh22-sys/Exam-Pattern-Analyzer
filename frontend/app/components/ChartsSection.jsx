"use client";

import { BarChart3, Grid3X3, PieChart } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import { motion } from "framer-motion";

// Mock data removed. We use an empty placeholder state when analysisData is missing.

function getHeatColor(val, maxHeatVal) {
  if (val === 0) return "rgba(255,255,255,0.02)";
  const intensity = Math.min(val / (maxHeatVal || 1), 1);
  return `rgba(255, 255, 255, ${0.04 + intensity * 0.25})`;
}

export default function ChartsSection() {
  const { analysisData } = useAnalysis();
  const hasData = !!analysisData && !!analysisData.top_topics;

  let barData = [];
  let heatmapData = [];
  let pieData = [];

  if (hasData) {
    // Monochrome gradient from bright white down to dimmer shades
    const monoColors = [
      "rgba(255,255,255,0.95)",
      "rgba(255,255,255,0.85)",
      "rgba(255,255,255,0.75)",
      "rgba(255,255,255,0.65)",
      "rgba(255,255,255,0.55)",
      "rgba(255,255,255,0.45)",
      "rgba(255,255,255,0.38)",
      "rgba(255,255,255,0.30)",
      "rgba(255,255,255,0.24)",
      "rgba(255,255,255,0.18)",
    ];
    barData = analysisData.top_topics.slice(0, 10).map((t, i) => ({
      label: t.chapter,
      value: t.total_hits,
      color: monoColors[i % monoColors.length]
    }));

    heatmapData = analysisData.top_topics.slice(0, 8).map(t => ({
      chapter: t.chapter,
      unit1: Math.floor(t.total_hits * 0.7),
      unit3: Math.floor(t.total_hits * 0.3)
    }));

    // Trend distribution pie — subtle distinct shades
    const increasing = analysisData.predictions.filter(p => p.trend === "Increasing").length;
    const stable = analysisData.predictions.filter(p => p.trend === "Stable").length;
    const decreasing = analysisData.predictions.filter(p => p.trend === "Decreasing").length;
    const totalChapters = increasing + stable + decreasing || 1;

    pieData = [
      { label: "Increasing T.", pct: Math.round((increasing / totalChapters) * 100), color: "rgba(255,255,255,0.9)" },
      { label: "Stable T.", pct: Math.round((stable / totalChapters) * 100), color: "rgba(255,255,255,0.45)" },
      { label: "Decreasing T.", pct: Math.round((decreasing / totalChapters) * 100), color: "rgba(255,255,255,0.18)" }
    ];
  }

  const maxBarValue = Math.max(...barData.map((d) => d.value), 1);
  const maxHeat = Math.max(...heatmapData.flatMap((d) => [d.unit1, d.unit3]), 1);

  return (
    <section id="charts" className="relative py-28 px-6">
      <div className="orb orb-blue w-[500px] h-[500px] bottom-0 left-[-10%] opacity-25" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Visual Insights
          </h2>
          <p className="text-text-secondary text-sm max-w-lg mx-auto">
            Data-driven visualizations to uncover patterns at a glance
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="chart-container p-6 lg:col-span-2"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <BarChart3 size={18} className={hasData ? "text-text-primary" : "text-text-muted"} />
              <h3 className="text-sm font-semibold text-text-primary">Topic Frequency</h3>
            </div>

            {hasData ? (
              <div className="space-y-3">
                {barData.map((d, i) => (
                  <div key={d.label + i} className="flex items-center gap-3">
                    <span className="text-xs text-text-muted w-24 text-right flex-shrink-0 truncate" title={d.label}>
                      {d.label}
                    </span>
                    <div className="flex-1 h-7 bg-bg-secondary/50 rounded-lg overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(d.value / maxBarValue) * 100}%` }}
                        transition={{ duration: 1, delay: 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        viewport={{ once: true }}
                        className="h-full rounded-lg flex items-center px-2.5"
                        style={{ background: d.color }}
                      >
                        <span className="text-[10px] font-bold text-black">{d.value}</span>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-xl">
                <span className="text-xs text-text-muted">Awaiting data...</span>
              </div>
            )}
          </motion.div>

          {/* Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="chart-container p-6"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <Grid3X3 size={18} className={hasData ? "text-text-primary" : "text-text-muted"} />
              <h3 className="text-sm font-semibold">Unit Distribution Heatmap</h3>
            </div>

            {hasData ? (
              <>
                <div className="grid grid-cols-[1fr_80px_80px] gap-2 mb-3">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider">Chapter</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider text-center">Unit 1</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider text-center">Unit 3</span>
                </div>
                <div className="space-y-2">
                  {heatmapData.map((d, i) => (
                    <motion.div key={d.chapter + i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }} className="grid grid-cols-[1fr_80px_80px] gap-2">
                      <span className="text-xs text-text-secondary truncate py-2" title={d.chapter}>{d.chapter}</span>
                      <div className="rounded-lg flex items-center justify-center py-2 text-xs font-mono font-medium" style={{ background: getHeatColor(d.unit1, maxHeat), color: d.unit1 > maxHeat * 0.3 ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.4)" }}>{d.unit1}</div>
                      <div className="rounded-lg flex items-center justify-center py-2 text-xs font-mono font-medium" style={{ background: getHeatColor(d.unit3, maxHeat), color: d.unit3 > maxHeat * 0.3 ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.4)" }}>{d.unit3}</div>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-xl mt-8">
                <span className="text-xs text-text-muted">Awaiting data...</span>
              </div>
            )}
          </motion.div>

          {/* Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="chart-container p-6 flex flex-col"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <PieChart size={18} className={hasData ? "text-text-primary" : "text-text-muted"} />
              <h3 className="text-sm font-semibold">Distribution Analysis</h3>
            </div>

            {hasData ? (
              <>
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative w-44 h-44">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {pieData.reduce((acc, d, i) => {
                        const circumference = 2 * Math.PI * 40;
                        const dashLength = (d.pct / 100) * circumference;
                        const dashGap = circumference - dashLength;
                        acc.elements.push(
                          <circle key={d.label + i} cx="50" cy="50" r="40" fill="none" stroke={d.color} strokeWidth="12" strokeDasharray={`${dashLength} ${dashGap}`} strokeDashoffset={-acc.offset} strokeLinecap="round" className="transition-all duration-1000" />
                        );
                        acc.offset += dashLength;
                        return acc;
                      }, { elements: [], offset: 0 }).elements}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">100%</span>
                      <span className="text-[10px] text-text-muted">Coverage</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  {pieData.map((d, i) => (
                    <div key={d.label + i} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-text-secondary flex-1">{d.label}</span>
                      <span className="text-xs font-semibold">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-xl mt-8">
                <span className="text-xs text-text-muted">Awaiting data...</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
