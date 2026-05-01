"use client";

import { motion } from "framer-motion";
import { Trophy, BarChart3, TrendingUp, Target, BookOpen, Zap } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";

// Mocks removed: we now show blank placeholder states before upload.

export default function Dashboard() {
  const { analysisData } = useAnalysis();
  const hasData = !!analysisData && !!analysisData.top_topics;

  // Determine which data to show
  let topTopics = [];
  let summaryCards = [
    {
      icon: Trophy,
      title: "Top Topics",
      value: "--",
      subtitle: "Upload a paper to see insights",
      accent: "text-muted",
      glow: "rgba(255,255,255,0.05)",
    },
    {
      icon: BarChart3,
      title: "Chapter Weightage",
      value: "--",
      subtitle: "Waiting for data...",
      accent: "text-muted",
      glow: "rgba(255,255,255,0.05)",
    },
    {
      icon: TrendingUp,
      title: "Predictions",
      value: "--",
      subtitle: "No data yet",
      accent: "text-muted",
      glow: "rgba(255,255,255,0.05)",
    },
  ];

  if (hasData) {
    // Total hits calculation for percentage
    const allHits = analysisData.top_topics.reduce((sum, t) => sum + t.total_hits, 0);

    topTopics = analysisData.top_topics.slice(0, 8).map((t, idx) => ({
      rank: idx + 1,
      name: t.chapter,
      hits: t.total_hits,
      pct: allHits > 0 ? parseFloat(((t.total_hits / allHits) * 100).toFixed(2)) : 0,
    }));

    // Dynamic Summary Cards
    const totalChapters = analysisData.predictions ? analysisData.predictions.length : 0;
    const trendingCount = analysisData.predictions ? analysisData.predictions.filter((p) => p.trend === "Increasing").length : 0;
    const topTopicName = topTopics.length > 0 ? topTopics[0].name : "N/A";
    const topTopicPct = topTopics.length > 0 ? topTopics[0].pct : 0;

    summaryCards = [
      {
        icon: Trophy,
        title: "Top Topics",
        value: topTopicName,
        subtitle: `${topTopicPct}% weightage — Highest across all papers`,
        accent: "text-primary",
        glow: "rgba(255,255,255,0.08)",
      },
      {
        icon: BarChart3,
        title: "Chapter Weightage",
        value: `${totalChapters} Chapters`,
        subtitle: "Tracked across all extracted papers",
        accent: "text-primary",
        glow: "rgba(255,255,255,0.06)",
      },
      {
        icon: TrendingUp,
        title: "Predictions",
        value: `${trendingCount} Trending`,
        subtitle: "Topics actively increasing in occurrence",
        accent: "text-primary",
        glow: "rgba(255,255,255,0.07)",
      },
    ];
  }

  return (
    <section id="dashboard" className="relative py-28 px-6">
      {/* Ambient */}
      <div className="orb orb-purple w-[500px] h-[500px] top-0 right-[-15%] opacity-30" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 mb-5">
            <Target size={13} className={hasData ? "text-white" : "text-text-muted"} />
            <span className={`text-xs font-medium ${hasData ? "text-white" : "text-text-muted"}`}>
              {hasData ? "Analysis Results (LIVE)" : "Pending Upload"}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Your Exam Intelligence
          </h2>
          <p className="text-text-secondary text-sm max-w-lg mx-auto">
            Real-time analytics from your uploaded papers, revealing patterns and
            high-priority topics.
          </p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              data-magnetic
              className="glass-card-strong p-6 group hover:border-border-hover transition-smooth"
              style={{
                boxShadow: `0 0 0px ${card.glow}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 40px ${card.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0px ${card.glow}`;
              }}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center mb-4`}
              >
                <card.icon size={20} className={`text-${card.accent}`} />
              </div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {card.title}
              </p>
              <p className="text-xl font-bold mb-1">{card.value}</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {card.subtitle}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Top Topics Ranking */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          viewport={{ once: true }}
          className="glass-card-strong p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Top Topics Ranking</h3>
              <p className="text-xs text-text-muted">
                Sorted by keyword frequency across all papers
              </p>
            </div>
          </div>

          {hasData ? (
            <div className="space-y-3">
              {topTopics.map((topic, i) => (
                <motion.div
                  key={topic.name + i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 group"
                >
                  {/* Rank */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0
                        ? "bg-gradient-to-br from-white to-gray-300 text-black"
                        : i === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-500 text-black"
                        : i === 2
                        ? "bg-gradient-to-br from-gray-500 to-gray-700 text-white"
                        : "bg-bg-secondary text-text-muted"
                    }`}
                  >
                    {topic.rank}
                  </div>

                  {/* Name */}
                  <span className="text-sm font-medium w-44 flex-shrink-0 truncate" title={topic.name}>
                    {topic.name}
                  </span>

                  {/* Bar */}
                  <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min(topic.pct * 5, 100)}%` }}
                      transition={{
                        duration: 1,
                        delay: 0.3 + i * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      viewport={{ once: true }}
                      className="h-full mini-bar-fill"
                    />
                  </div>

                  {/* Stats */}
                  <span className="text-xs text-text-muted w-16 text-right flex-shrink-0">
                    {topic.hits} hits
                  </span>
                  <span className="text-xs font-medium text-accent w-12 text-right flex-shrink-0">
                    {topic.pct}%
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border rounded-xl bg-white/[0.01]">
              <div className="w-12 h-12 mb-4 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted">
                <BookOpen size={20} />
              </div>
              <h4 className="text-sm font-semibold mb-1">No topics analyzed yet</h4>
              <p className="text-xs text-text-muted max-w-sm">
                Upload your previous year question papers above to extract and rank the most important topics.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
