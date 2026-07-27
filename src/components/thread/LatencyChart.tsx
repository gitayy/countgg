import React, { memo, useMemo } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { LatencySample } from './LatencyChartHost';

const WARN_MS = 1000;
const CRIT_MS = 5000;

const COLORS = {
  scheduling: '#ab47bc',
  dbRead:     '#42a5f5',
  dbWrite:    '#ef5350',
  other:      '#66bb6a',
};

function totalMs(s: LatencySample) {
  return s.schedulingMs + s.dbReadMs + s.dbWriteMs + s.otherMs;
}

function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
}

function healthColor(p95total: number): 'success' | 'warning' | 'error' {
  if (p95total >= CRIT_MS) return 'error';
  if (p95total >= WARN_MS) return 'warning';
  return 'success';
}
function healthLabel(p95total: number): string {
  if (p95total >= CRIT_MS) return 'Degraded';
  if (p95total >= WARN_MS) return 'Slow';
  return 'Healthy';
}

interface Props {
  samples: LatencySample[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const total = (payload as any[]).reduce((s: number, p: any) => s + (p.value ?? 0), 0);
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', p: 1, borderRadius: 1, fontSize: 11 }}>
      {(payload as any[]).map((p: any) => (
        <Box key={p.dataKey} sx={{ color: p.fill, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
          <span>{p.name}</span><strong>{p.value}ms</strong>
        </Box>
      ))}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 0.5, pt: 0.5, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
        <span>total</span><strong>{total}ms</strong>
      </Box>
    </Box>
  );
};

export const LatencyChart = memo(function LatencyChart({ samples }: Props) {
  const { chartData, p95total, avgTotal, avgScheduling, avgRead, avgWrite, avgOther } = useMemo(() => {
    if (samples.length === 0) return { chartData: [], p95total: 0, avgTotal: 0, avgScheduling: 0, avgRead: 0, avgWrite: 0, avgOther: 0 };
    const totals = samples.map(totalMs);
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    return {
      chartData: samples.map((s, i) => ({ i, scheduling: s.schedulingMs, dbRead: s.dbReadMs, dbWrite: s.dbWriteMs, other: s.otherMs })),
      p95total: p95(totals),
      avgTotal: avg(totals),
      avgScheduling: avg(samples.map(s => s.schedulingMs)),
      avgRead: avg(samples.map(s => s.dbReadMs)),
      avgWrite: avg(samples.map(s => s.dbWriteMs)),
      avgOther: avg(samples.map(s => s.otherMs)),
    };
  }, [samples]);

  const color = healthColor(p95total);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap', minHeight: 24 }}>
        {samples.length > 0 && <Chip size="small" label={healthLabel(p95total)} color={color} variant="filled" />}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap', minHeight: 18 }}>
        {samples.length > 0 && <>
          <Typography variant="caption" color="text.secondary">avg total <strong>{avgTotal}ms</strong></Typography>
          <Typography variant="caption" color="text.secondary">p95 <strong>{p95total}ms</strong></Typography>
          <Typography variant="caption" sx={{ color: COLORS.scheduling }}>queue wait <strong>{avgScheduling}ms</strong></Typography>
          <Typography variant="caption" sx={{ color: COLORS.dbRead }}>reads <strong>{avgRead}ms</strong></Typography>
          <Typography variant="caption" sx={{ color: COLORS.dbWrite }}>writes <strong>{avgWrite}ms</strong></Typography>
          <Typography variant="caption" sx={{ color: COLORS.other }}>other <strong>{avgOther}ms</strong></Typography>
          <Typography variant="caption" color="text.secondary">last {samples.length} posts</Typography>
        </>}
      </Box>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            {(['scheduling', 'dbRead', 'dbWrite', 'other'] as const).map((key) => (
              <linearGradient key={key} id={`grad_${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS[key]} stopOpacity={0.5} />
                <stop offset="95%" stopColor={COLORS[key]} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis tickFormatter={(v) => `${v}ms`} width={55} tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={WARN_MS} stroke="#ff9800" strokeDasharray="3 3" />
          <ReferenceLine y={CRIT_MS} stroke="#f44336" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="scheduling" name="Scheduling" stackId="1" stroke={COLORS.scheduling} fill={`url(#grad_scheduling)`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Area type="monotone" dataKey="dbWrite" name="DB write" stackId="1" stroke={COLORS.dbWrite} fill={`url(#grad_dbWrite)`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Area type="monotone" dataKey="dbRead"  name="DB read"  stackId="1" stroke={COLORS.dbRead}  fill={`url(#grad_dbRead)`}  strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Area type="monotone" dataKey="other"   name="Other"    stackId="1" stroke={COLORS.other}   fill={`url(#grad_other)`}   strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
      <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
        {(['scheduling', 'dbRead', 'dbWrite', 'other'] as const).map((key) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[key] }} />
            <Typography variant="caption" color="text.secondary">
              {{ scheduling: 'Queue wait', dbRead: 'DB read', dbWrite: 'DB write', other: 'Other' }[key]}
            </Typography>
          </Box>
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box component="span" sx={{ display: 'inline-block', width: 16, borderTop: '2px dashed #ff9800' }} /> 1s warn
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box component="span" sx={{ display: 'inline-block', width: 16, borderTop: '2px dashed #f44336' }} /> 5s crit
        </Typography>
      </Box>
    </Box>
  );
});
