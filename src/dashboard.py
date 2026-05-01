"""
dashboard.py - Generates a beautiful HTML dashboard from the analysis report.

Creates a single-file dashboard (dashboard/index.html) with:
  - Summary cards
  - Top topics bar chart
  - Chapter weightage table
  - Trend indicators
  - All rendered with vanilla HTML/CSS/JS (Chart.js via CDN)
"""

import json
from pathlib import Path


def generate_dashboard(report: dict, output_folder: str) -> str:
    """
    Generates an interactive HTML dashboard from analysis data.

    Args:
        report: The full analysis report dict.
        output_folder: Where to save the dashboard.

    Returns:
        Path to the generated index.html.
    """
    output_folder = Path(output_folder)
    output_folder.mkdir(parents=True, exist_ok=True)

    top_topics = report.get("top_topics", [])
    trends = report.get("trends", [])
    summary = report.get("summary", {})
    match_results = report.get("match_results", {})
    per_pdf = match_results.get("per_pdf", [])

    # Prepare chart data
    chart_labels = json.dumps([t["chapter"][:25] for t in top_topics[:15]])
    chart_values = json.dumps([t["total_hits"] for t in top_topics[:15]])
    chart_percents = json.dumps([t["avg_percent"] for t in top_topics[:15]])

    # Prepare trend table rows
    trend_rows = ""
    for t in trends:
        if t["total"] == 0:
            continue
        icon = t.get("trend_icon", "")
        trend_class = t["trend"]
        hits_str = " | ".join(
            f'{h["year"]}: {h["hits"]}' for h in t["hits_per_year"]
        )
        trend_rows += f"""
        <tr class="trend-{trend_class}">
          <td>{t['chapter']}</td>
          <td>{t['total']}</td>
          <td>{t['avg_percent']}%</td>
          <td class="trend-tag">{icon} {trend_class.upper()}</td>
          <td class="hits-detail">{hits_str}</td>
        </tr>"""

    # Prepare per-PDF summary
    pdf_cards = ""
    for pdf in per_pdf:
        top_ch = sorted(pdf["hits"].items(), key=lambda x: x[1], reverse=True)[:3]
        top_ch_html = "".join(
            f'<div class="mini-bar"><span class="mini-label">{ch[:20]}</span>'
            f'<div class="mini-fill" style="width:{min(hits*2, 100)}%">{hits}</div></div>'
            for ch, hits in top_ch
        )
        pdf_cards += f"""
        <div class="pdf-card">
          <div class="pdf-name">{pdf['filename'][:50]}</div>
          <div class="pdf-year">Year/ID: {pdf['year']}</div>
          <div class="pdf-total">Total Hits: {sum(pdf['hits'].values())}</div>
          <div class="pdf-top">{top_ch_html}</div>
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exam Pattern Analyzer - Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }}

    :root {{
      --bg-primary: #0a0a0f;
      --bg-secondary: #12121a;
      --bg-card: #1a1a2e;
      --bg-card-hover: #1e1e35;
      --text-primary: #e8e8f0;
      --text-secondary: #8888a0;
      --text-muted: #555570;
      --accent-blue: #4f8fff;
      --accent-purple: #8b5cf6;
      --accent-green: #22c55e;
      --accent-red: #ef4444;
      --accent-orange: #f59e0b;
      --accent-cyan: #06b6d4;
      --border-subtle: rgba(255,255,255,0.06);
      --glow-blue: rgba(79,143,255,0.15);
      --glow-purple: rgba(139,92,246,0.15);
    }}

    body {{
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
    }}

    /* === Animated Background === */
    body::before {{
      content: '';
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background:
        radial-gradient(ellipse 800px 400px at 20% 20%, var(--glow-blue), transparent),
        radial-gradient(ellipse 600px 400px at 80% 80%, var(--glow-purple), transparent);
      pointer-events: none;
      z-index: 0;
    }}

    .container {{
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      position: relative;
      z-index: 1;
    }}

    /* === Header === */
    .header {{
      text-align: center;
      margin-bottom: 3rem;
      padding: 2.5rem 1rem;
    }}
    .header h1 {{
      font-size: 2.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple), var(--accent-cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -1px;
      margin-bottom: 0.5rem;
    }}
    .header p {{
      color: var(--text-secondary);
      font-size: 1rem;
      font-weight: 400;
    }}

    /* === Summary Cards === */
    .summary-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }}
    .stat-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }}
    .stat-card::before {{
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      border-radius: 16px 16px 0 0;
    }}
    .stat-card:nth-child(1)::before {{ background: var(--accent-blue); }}
    .stat-card:nth-child(2)::before {{ background: var(--accent-purple); }}
    .stat-card:nth-child(3)::before {{ background: var(--accent-green); }}
    .stat-card:nth-child(4)::before {{ background: var(--accent-cyan); }}
    .stat-card:hover {{
      transform: translateY(-4px);
      border-color: rgba(255,255,255,0.12);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }}
    .stat-number {{
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--accent-blue);
      line-height: 1;
      margin-bottom: 0.5rem;
    }}
    .stat-card:nth-child(2) .stat-number {{ color: var(--accent-purple); }}
    .stat-card:nth-child(3) .stat-number {{ color: var(--accent-green); }}
    .stat-card:nth-child(4) .stat-number {{ color: var(--accent-cyan); }}
    .stat-label {{
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }}

    /* === Sections === */
    .section {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 2rem;
      transition: border-color 0.3s;
    }}
    .section:hover {{
      border-color: rgba(255,255,255,0.1);
    }}
    .section-title {{
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }}
    .section-icon {{
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }}

    /* === Chart === */
    .chart-container {{
      position: relative;
      height: 400px;
      width: 100%;
    }}

    /* === Table === */
    .data-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }}
    .data-table th {{
      text-align: left;
      padding: 0.8rem 1rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 1px;
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      background: var(--bg-card);
    }}
    .data-table td {{
      padding: 0.7rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-primary);
    }}
    .data-table tr:hover td {{
      background: var(--bg-card-hover);
    }}
    .trend-tag {{
      font-weight: 600;
      font-size: 0.8rem;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }}
    .trend-trending .trend-tag {{
      color: var(--accent-green);
      background: rgba(34,197,94,0.1);
    }}
    .trend-fading .trend-tag {{
      color: var(--accent-red);
      background: rgba(239,68,68,0.1);
    }}
    .trend-stable .trend-tag {{
      color: var(--accent-orange);
      background: rgba(245,158,11,0.1);
    }}
    .trend-absent .trend-tag {{
      color: var(--text-muted);
    }}
    .hits-detail {{
      color: var(--text-muted);
      font-size: 0.75rem;
      font-family: 'Courier New', monospace;
    }}

    /* === PDF Cards === */
    .pdf-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1rem;
    }}
    .pdf-card {{
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 1.2rem;
      transition: all 0.3s;
    }}
    .pdf-card:hover {{
      border-color: var(--accent-blue);
      transform: translateY(-2px);
    }}
    .pdf-name {{
      font-weight: 600;
      font-size: 0.85rem;
      margin-bottom: 0.3rem;
      word-break: break-all;
    }}
    .pdf-year {{
      color: var(--accent-cyan);
      font-size: 0.75rem;
      font-weight: 500;
      margin-bottom: 0.3rem;
    }}
    .pdf-total {{
      color: var(--text-secondary);
      font-size: 0.8rem;
      margin-bottom: 0.8rem;
    }}
    .mini-bar {{
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.3rem;
    }}
    .mini-label {{
      font-size: 0.7rem;
      color: var(--text-secondary);
      min-width: 130px;
    }}
    .mini-fill {{
      height: 18px;
      background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
      border-radius: 4px;
      font-size: 0.65rem;
      color: white;
      display: flex;
      align-items: center;
      padding: 0 6px;
      min-width: 24px;
      font-weight: 600;
    }}

    /* === Top Topics List === */
    .top-list {{
      counter-reset: rank;
    }}
    .top-item {{
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.8rem 0;
      border-bottom: 1px solid var(--border-subtle);
    }}
    .top-item:last-child {{
      border-bottom: none;
    }}
    .top-rank {{
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
      flex-shrink: 0;
    }}
    .top-item:nth-child(1) .top-rank {{ background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #000; }}
    .top-item:nth-child(2) .top-rank {{ background: linear-gradient(135deg, #94a3b8, #64748b); color: #000; }}
    .top-item:nth-child(3) .top-rank {{ background: linear-gradient(135deg, #d97706, #b45309); color: #fff; }}
    .top-item:nth-child(n+4) .top-rank {{ background: var(--bg-secondary); color: var(--text-secondary); }}
    .top-info {{
      flex: 1;
    }}
    .top-name {{
      font-weight: 600;
      font-size: 0.9rem;
    }}
    .top-hits {{
      color: var(--text-secondary);
      font-size: 0.75rem;
    }}
    .top-bar-wrapper {{
      flex: 1;
      max-width: 200px;
    }}
    .top-bar-bg {{
      background: var(--bg-secondary);
      border-radius: 6px;
      height: 8px;
      overflow: hidden;
    }}
    .top-bar-fill {{
      height: 100%;
      border-radius: 6px;
      background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
      transition: width 1s ease;
    }}

    /* === Footer === */
    .footer {{
      text-align: center;
      padding: 2rem 0;
      color: var(--text-muted);
      font-size: 0.75rem;
    }}

    /* === Responsive === */
    @media (max-width: 768px) {{
      .header h1 {{ font-size: 1.8rem; }}
      .summary-grid {{ grid-template-columns: repeat(2, 1fr); }}
      .chart-container {{ height: 300px; }}
    }}

    /* === Scroll Animation === */
    .fade-in {{
      opacity: 0;
      transform: translateY(20px);
      animation: fadeUp 0.6s ease forwards;
    }}
    @keyframes fadeUp {{
      to {{
        opacity: 1;
        transform: translateY(0);
      }}
    }}
    .section:nth-child(2) {{ animation-delay: 0.1s; }}
    .section:nth-child(3) {{ animation-delay: 0.2s; }}
    .section:nth-child(4) {{ animation-delay: 0.3s; }}
    .section:nth-child(5) {{ animation-delay: 0.4s; }}
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header fade-in">
      <h1>Exam Pattern Analyzer</h1>
      <p>Computer Organization &amp; Architecture &mdash; RGPV CS-404</p>
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid fade-in">
      <div class="stat-card">
        <div class="stat-number">{summary.get('total_pdfs', 0)}</div>
        <div class="stat-label">PDFs Analyzed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{summary.get('total_chapters', 0)}</div>
        <div class="stat-label">Chapters Tracked</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{top_topics[0]['total_hits'] if top_topics else 0}</div>
        <div class="stat-label">Top Chapter Hits</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{len([t for t in trends if t['total'] > 0])}</div>
        <div class="stat-label">Active Topics</div>
      </div>
    </div>

    <!-- Top 15 Topics Ranking -->
    <div class="section fade-in">
      <div class="section-title">
        <span class="section-icon" style="background:rgba(79,143,255,0.15)">&#127942;</span>
        Top Topics by Keyword Hits
      </div>
      <div class="top-list">
        {''.join(f"""
        <div class="top-item">
          <div class="top-rank">{t['rank']}</div>
          <div class="top-info">
            <div class="top-name">{t['chapter']}</div>
            <div class="top-hits">{t['total_hits']} hits &middot; {t['avg_percent']}%</div>
          </div>
          <div class="top-bar-wrapper">
            <div class="top-bar-bg">
              <div class="top-bar-fill" style="width:{min(t['avg_percent'] * 3, 100)}%"></div>
            </div>
          </div>
        </div>""" for t in top_topics[:10])}
      </div>
    </div>

    <!-- Chart -->
    <div class="section fade-in">
      <div class="section-title">
        <span class="section-icon" style="background:rgba(139,92,246,0.15)">&#128202;</span>
        Chapter Weightage Distribution
      </div>
      <div class="chart-container">
        <canvas id="topChart"></canvas>
      </div>
    </div>

    <!-- Trend Analysis Table -->
    <div class="section fade-in">
      <div class="section-title">
        <span class="section-icon" style="background:rgba(34,197,94,0.15)">&#128200;</span>
        Year-wise Trend Analysis
      </div>
      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Chapter</th>
              <th>Total Hits</th>
              <th>Weightage</th>
              <th>Trend</th>
              <th>Hits per PDF</th>
            </tr>
          </thead>
          <tbody>
            {trend_rows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Per-PDF Breakdown -->
    <div class="section fade-in">
      <div class="section-title">
        <span class="section-icon" style="background:rgba(6,182,212,0.15)">&#128196;</span>
        Per-PDF Breakdown
      </div>
      <div class="pdf-grid">
        {pdf_cards}
      </div>
    </div>

    <div class="footer">
      Exam Pattern Analyzer &mdash; Built with Python + Chart.js
    </div>
  </div>

  <script>
    // Chart.js bar chart
    const ctx = document.getElementById('topChart').getContext('2d');
    new Chart(ctx, {{
      type: 'bar',
      data: {{
        labels: {chart_labels},
        datasets: [{{
          label: 'Keyword Hits',
          data: {chart_values},
          backgroundColor: [
            'rgba(79,143,255,0.7)',
            'rgba(139,92,246,0.7)',
            'rgba(6,182,212,0.7)',
            'rgba(34,197,94,0.7)',
            'rgba(245,158,11,0.7)',
            'rgba(239,68,68,0.7)',
            'rgba(79,143,255,0.5)',
            'rgba(139,92,246,0.5)',
            'rgba(6,182,212,0.5)',
            'rgba(34,197,94,0.5)',
            'rgba(245,158,11,0.5)',
            'rgba(239,68,68,0.5)',
            'rgba(79,143,255,0.3)',
            'rgba(139,92,246,0.3)',
            'rgba(6,182,212,0.3)'
          ],
          borderColor: [
            'rgba(79,143,255,1)',
            'rgba(139,92,246,1)',
            'rgba(6,182,212,1)',
            'rgba(34,197,94,1)',
            'rgba(245,158,11,1)',
            'rgba(239,68,68,1)',
            'rgba(79,143,255,0.8)',
            'rgba(139,92,246,0.8)',
            'rgba(6,182,212,0.8)',
            'rgba(34,197,94,0.8)',
            'rgba(245,158,11,0.8)',
            'rgba(239,68,68,0.8)',
            'rgba(79,143,255,0.6)',
            'rgba(139,92,246,0.6)',
            'rgba(6,182,212,0.6)'
          ],
          borderWidth: 1,
          borderRadius: 6,
        }}]
      }},
      options: {{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {{
          legend: {{ display: false }},
          tooltip: {{
            backgroundColor: '#1a1a2e',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#e8e8f0',
            bodyColor: '#8888a0',
            cornerRadius: 8,
            padding: 12,
          }}
        }},
        scales: {{
          x: {{
            ticks: {{
              color: '#8888a0',
              font: {{ size: 10 }},
              maxRotation: 45,
              minRotation: 30
            }},
            grid: {{ display: false }}
          }},
          y: {{
            ticks: {{ color: '#8888a0' }},
            grid: {{ color: 'rgba(255,255,255,0.04)' }},
            beginAtZero: true
          }}
        }}
      }}
    }});
  </script>
</body>
</html>"""

    html_path = output_folder / "index.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"  Dashboard saved: {html_path}")
    return str(html_path)
