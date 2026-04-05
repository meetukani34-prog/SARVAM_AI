import React from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(12,12,30,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#f1f5f9',
  fontSize: '0.8rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}

const AXIS_STYLE = {
  fill: '#475569',
  fontSize: 11,
  fontFamily: 'Inter, sans-serif',
}

export function WeeklyChart({ data }) {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradComm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradSkill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
          <XAxis dataKey="day" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} domain={[0, 100]} width={30} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(v) => (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
                {v === 'score' ? 'Overall' : v === 'communication' ? 'Comm.' : 'Skills'}
              </span>
            )}
          />
          <Area type="monotone" dataKey="score"         stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gradScore)" dot={false} />
          <Area type="monotone" dataKey="communication" stroke="#06b6d4" strokeWidth={2.5} fill="url(#gradComm)"  dot={false} />
          <Area type="monotone" dataKey="skills"        stroke="#10b981" strokeWidth={2.5} fill="url(#gradSkill)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SkillBarChart({ data }) {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} layout="vertical">
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={AXIS_STYLE} axisLine={false} tickLine={false} hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ ...AXIS_STYLE, fontSize: 11, fontWeight: 500 }} 
            axisLine={false} 
            tickLine={false} 
            width={120} // Sized up for long labels
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="score" radius={[0, 6, 6, 0]} fill="url(#barGrad)" barSize={20} />
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
