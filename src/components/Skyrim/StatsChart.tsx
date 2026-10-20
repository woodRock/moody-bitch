import React, { useMemo, useState } from 'react';
import type { MoodEntry } from '../../game/types';

/** Palette validated for the dark surface (lightness band, chroma, CVD separation, contrast). */
const SERIES = [
  { key: 'mood', label: 'Health', real: 'mood', color: '#e05a4e' },
  { key: 'energy', label: 'Stamina', real: 'energy', color: '#3fae3c' },
  { key: 'sleep', label: 'Magicka', real: 'rest', color: '#3d8de0' },
] as const;

type SeriesKey = typeof SERIES[number]['key'];

interface Point { date: Date; label: string; mood: number; energy: number; sleep: number }

const W = 640, H = 260, PAD = { l: 34, r: 72, t: 16, b: 32 };

const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/**
 * Attribute scores over the last N logs. Sleep is shown as the Magicka score
 * the game derives from it (hours capped at 10) so all three share one axis.
 */
const StatsChart: React.FC<{ entries: MoodEntry[]; maxPoints?: number }> = ({ entries, maxPoints = 30 }) => {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  const points = useMemo<Point[]>(() => [...entries]
    .slice(0, maxPoints)
    .reverse()
    .map(e => {
      const date = e.timestamp.toDate();
      return { date, label: fmt(date), mood: e.mood, energy: e.energy, sleep: Math.min(10, e.sleep) };
    }), [entries, maxPoints]);

  if (points.length === 0) {
    return <p className="skyrim-serif chart-empty">No chronicles yet. Scribe a daily log to begin the lineage.</p>;
  }

  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.t + innerH - (v / 10) * innerH;
  const path = (key: SeriesKey) => points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0, bestD = Infinity;
    points.forEach((_, i) => { const d = Math.abs(x(i) - px); if (d < bestD) { bestD = d; best = i; } });
    setHover(best);
  };

  // Direct labels: nudge apart when two series end at the same value.
  const last = points[points.length - 1];
  const labelY: Record<SeriesKey, number> = { mood: y(last.mood), energy: y(last.energy), sleep: y(last.sleep) };
  const order = (Object.keys(labelY) as SeriesKey[]).sort((a, b) => labelY[a] - labelY[b]);
  for (let i = 1; i < order.length; i++) {
    const prev = order[i - 1], cur = order[i];
    if (labelY[cur] - labelY[prev] < 14) labelY[cur] = labelY[prev] + 14;
  }

  const xLabelIdx = points.length <= 3 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const hp = hover !== null ? points[hover] : null;
  const tooltipLeft = hover !== null && x(hover) > W * 0.6;

  return (
    <div className="stats-chart">
      <div className="chart-header">
        <div className="chart-legend" aria-hidden="true">
          {SERIES.map(s => (
            <span key={s.key} className="legend-item"><i style={{ background: s.color }} />{s.label} <span className="legend-real">({s.real})</span></span>
          ))}
        </div>
        <button type="button" className="btn-ghost small skyrim-font" onClick={() => setTable(t => !t)}>{table ? 'CHART' : 'TABLE'}</button>
      </div>

      {table ? (
        <div className="chart-table-wrap">
          <table className="chart-table skyrim-serif">
            <thead><tr><th>Day</th>{SERIES.map(s => <th key={s.key}>{s.label} ({s.real})</th>)}</tr></thead>
            <tbody>
              {[...points].reverse().map((p, i) => (
                <tr key={i}><td>{p.label}</td><td>{p.mood}</td><td>{p.energy}</td><td>{p.sleep}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label="Health, Stamina and Magicka scores over recent days"
          onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {[0, 5, 10].map(v => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="chart-grid" />
              <text x={PAD.l - 8} y={y(v) + 4} className="chart-axis-text" textAnchor="end">{v}</text>
            </g>
          ))}
          {xLabelIdx.map(i => (
            <text key={i} x={x(i)} y={H - 10} className="chart-axis-text" textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>{points[i].label}</text>
          ))}
          {SERIES.map(s => (
            <g key={s.key}>
              <path d={path(s.key)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {points.length === 1 && <circle cx={x(0)} cy={y(points[0][s.key])} r={4} fill={s.color} />}
              <text x={W - PAD.r + 8} y={labelY[s.key] + 4} className="chart-direct-label" fill={s.color}>{s.label}</text>
            </g>
          ))}
          {hp && hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} className="chart-crosshair" />
              {SERIES.map(s => (
                <circle key={s.key} cx={x(hover)} cy={y(hp[s.key])} r={5} fill={s.color} stroke="#141414" strokeWidth={2} />
              ))}
              <foreignObject x={tooltipLeft ? x(hover) - 150 : x(hover) + 10} y={PAD.t} width={140} height={90}>
                <div className="chart-tooltip skyrim-serif">
                  <div className="chart-tooltip-date">{hp.label}</div>
                  {SERIES.map(s => <div key={s.key}><i style={{ background: s.color }} />{s.label} <span className="legend-real">({s.real})</span> <b>{hp[s.key]}</b></div>)}
                </div>
              </foreignObject>
            </g>
          )}
        </svg>
      )}
    </div>
  );
};

export default StatsChart;
