import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import "./trends.css";

function BarChart({ data }: { data: { day: string; count: number }[] }) {
  if (data.length === 0) return <p className="empty-hint">No reading activity in the last 30 days yet.</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  const width = 720;
  const height = 160;
  const barWidth = width / data.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="bar-chart" role="img" aria-label="Items read per day">
      {data.map((d, i) => {
        const barHeight = (d.count / max) * (height - 20);
        return (
          <g key={d.day}>
            <rect
              x={i * barWidth + 2}
              y={height - barHeight - 20}
              width={Math.max(barWidth - 4, 1)}
              height={barHeight}
              fill="var(--accent)"
              rx={2}
            >
              <title>{`${d.day}: ${d.count} read`}</title>
            </rect>
          </g>
        );
      })}
      <line x1={0} y1={height - 20} x2={width} y2={height - 20} stroke="var(--border)" />
    </svg>
  );
}

export function TrendsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["trends"], queryFn: api.trends });

  return (
    <div className="trends-page">
      <div className="trends-header">
        <Link to="/">&larr; Back to Reader</Link>
        <h1>Trends</h1>
      </div>

      {isLoading || !data ? (
        <p>Loading…</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">{data.subscriptionCount}</div>
              <div className="stat-label">Subscriptions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.totalRead}</div>
              <div className="stat-label">Items read (all time)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.readLast30}</div>
              <div className="stat-label">Read in last 30 days</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.unreadNow}</div>
              <div className="stat-label">Unread now</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.totalStarred}</div>
              <div className="stat-label">Starred</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.totalShared}</div>
              <div className="stat-label">Shared</div>
            </div>
          </div>

          <section>
            <h2>Reading activity (last 30 days)</h2>
            <BarChart data={data.dailyReadCounts} />
          </section>

          <section>
            <h2>Your most active subscriptions</h2>
            {data.mostActiveFeeds.length === 0 ? (
              <p className="empty-hint">Read a few items to see your top feeds here.</p>
            ) : (
              <ol className="active-feeds-list">
                {data.mostActiveFeeds.map((f) => (
                  <li key={f.feedId}>
                    <span className="feed-title">{f.title}</span>
                    <span className="feed-count">{f.readCount} read</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
