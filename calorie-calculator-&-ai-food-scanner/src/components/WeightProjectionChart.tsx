import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { GoalCalorieTier, ThemeMode } from '../types';
import {
  TrendingDown,
  TrendingUp,
  Scale,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface WeightProjectionChartProps {
  startingWeightKg: number;
  activeTier: GoalCalorieTier;
  allTiers?: GoalCalorieTier[];
  theme: ThemeMode;
  unitSystem?: 'metric' | 'imperial';
  targetWeightKg?: number | '';
}

interface ProjectionDataPoint {
  week: number;
  weekLabel: string;
  weightKg: number;
  weightLbs: number;
  changeKg: number;
  changeLbs: number;
  mildKg?: number;
  standardKg?: number;
  aggressiveKg?: number;
  [key: string]: number | string | undefined;
}

export const WeightProjectionChart: React.FC<WeightProjectionChartProps> = ({
  startingWeightKg,
  activeTier,
  allTiers = [],
  theme,
  unitSystem = 'metric',
  targetWeightKg,
}) => {
  const isDark = theme === 'dark';
  const [showComparison, setShowComparison] = useState(false);
  const [chartUnit, setChartUnit] = useState<'kg' | 'lbs'>(unitSystem === 'imperial' ? 'lbs' : 'kg');

  // Sync unit with parent unitSystem if user changes it
  React.useEffect(() => {
    setChartUnit(unitSystem === 'imperial' ? 'lbs' : 'kg');
  }, [unitSystem]);

  // Generate 12-week trajectory
  const data = useMemo<ProjectionDataPoint[]>(() => {
    const startKg = startingWeightKg || 70;
    const weeklyRateKg = activeTier.weeklyFatChangeKg; // e.g. -0.5 for standard cut, +0.25 for lean gain, 0 for maintain

    // Find mild, standard, aggressive rates for comparison
    const mildRate = allTiers.find((t) => t.id.includes('mild'))?.weeklyFatChangeKg ?? (weeklyRateKg > 0 ? 0.25 : -0.25);
    const standardRate = allTiers.find((t) => t.id.includes('standard'))?.weeklyFatChangeKg ?? (weeklyRateKg > 0 ? 0.5 : -0.5);
    const aggressiveRate = allTiers.find((t) => t.id.includes('aggressive'))?.weeklyFatChangeKg ?? (weeklyRateKg > 0 ? 0.75 : -0.75);

    const points: ProjectionDataPoint[] = [];

    for (let w = 0; w <= 12; w++) {
      const activeKg = Number((startKg + weeklyRateKg * w).toFixed(2));
      const activeLbs = Number((activeKg * 2.20462).toFixed(1));
      const diffKg = Number((activeKg - startKg).toFixed(2));
      const diffLbs = Number((activeLbs - startKg * 2.20462).toFixed(1));

      const point: ProjectionDataPoint = {
        week: w,
        weekLabel: w === 0 ? 'Today' : `Wk ${w}`,
        weightKg: activeKg,
        weightLbs: activeLbs,
        changeKg: diffKg,
        changeLbs: diffLbs,
      };

      if (showComparison) {
        const mKg = Number((startKg + mildRate * w).toFixed(2));
        const sKg = Number((startKg + standardRate * w).toFixed(2));
        const aKg = Number((startKg + aggressiveRate * w).toFixed(2));

        if (chartUnit === 'lbs') {
          point.mild = Number((mKg * 2.20462).toFixed(1));
          point.standard = Number((sKg * 2.20462).toFixed(1));
          point.aggressive = Number((aKg * 2.20462).toFixed(1));
        } else {
          point.mild = mKg;
          point.standard = sKg;
          point.aggressive = aKg;
        }
      }

      // Main plotted value depending on unit
      point.mainValue = chartUnit === 'lbs' ? activeLbs : activeKg;

      points.push(point);
    }

    return points;
  }, [startingWeightKg, activeTier, allTiers, showComparison, chartUnit]);

  // Forecast summaries
  const week4Point = data[4];
  const week8Point = data[8];
  const week12Point = data[12];
  const totalProjectedDiff = chartUnit === 'lbs' ? week12Point?.changeLbs : week12Point?.changeKg;
  const startVal = chartUnit === 'lbs' ? Number((startingWeightKg * 2.20462).toFixed(1)) : startingWeightKg;
  const endVal = chartUnit === 'lbs' ? week12Point?.weightLbs : week12Point?.weightKg;

  // Custom Chart Colors
  const isLoss = activeTier.weeklyFatChangeKg < 0;
  const isGain = activeTier.weeklyFatChangeKg > 0;

  const strokeColor = isLoss ? '#10b981' : isGain ? '#3b82f6' : '#8b5cf6'; // Emerald for loss, Blue for gain, Purple for maintain
  const gradientId = isLoss ? 'lossGradient' : isGain ? 'gainGradient' : 'maintainGradient';

  // Calculate Y-domain padding
  const values = data.map((d) => Number(d.mainValue));
  if (showComparison) {
    data.forEach((d) => {
      if (typeof d.mild === 'number') values.push(d.mild);
      if (typeof d.standard === 'number') values.push(d.standard);
      if (typeof d.aggressive === 'number') values.push(d.aggressive);
    });
  }
  const minVal = Math.floor(Math.min(...values) - (chartUnit === 'lbs' ? 2 : 1));
  const maxVal = Math.ceil(Math.max(...values) + (chartUnit === 'lbs' ? 2 : 1));

  return (
    <div
      id="weight-projection-container"
      className={`rounded-3xl p-5 sm:p-6 border transition-colors space-y-4 ${
        isDark
          ? 'bg-[#13171f] border-[#222834] text-white shadow-lg'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-xl text-xs font-bold flex items-center justify-center ${
                isLoss
                  ? isDark
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-emerald-100 text-emerald-800'
                  : isGain
                  ? isDark
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'bg-blue-100 text-blue-800'
                  : isDark
                  ? 'bg-purple-500/15 text-purple-400'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {isLoss ? (
                <TrendingDown className="w-4 h-4" />
              ) : isGain ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <Scale className="w-4 h-4" />
              )}
            </span>
            <h4 className="font-extrabold text-sm sm:text-base tracking-tight">
              12-Week Projected Trajectory
            </h4>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {activeTier.title}
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Estimated body mass progression based on a daily {Math.abs(activeTier.diff)} kcal{' '}
            {activeTier.diff < 0 ? 'deficit' : activeTier.diff > 0 ? 'surplus' : 'balance'}.
          </p>
        </div>

        {/* Toggles: Multi-pace & Units */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Compare toggle */}
          {activeTier.diff !== 0 && (
            <button
              type="button"
              onClick={() => setShowComparison(!showComparison)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                showComparison
                  ? isDark
                    ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                    : 'bg-blue-50 text-blue-800 border-blue-200 font-bold'
                  : isDark
                  ? 'bg-[#181c24] text-slate-400 border-[#2b3342] hover:text-white'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
              title="Compare mild, standard, and aggressive paces"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compare Paces</span>
              <span className="sm:hidden">Paces</span>
            </button>
          )}

          {/* Unit Toggle (kg / lbs) */}
          <div
            className={`flex p-0.5 rounded-xl border text-xs font-bold ${
              isDark ? 'bg-[#181c24] border-[#2b3342]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setChartUnit('kg')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                chartUnit === 'kg'
                  ? isDark
                    ? 'bg-[#293241] text-white shadow-xs'
                    : 'bg-white text-slate-950 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setChartUnit('lbs')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                chartUnit === 'lbs'
                  ? isDark
                    ? 'bg-[#293241] text-white shadow-xs'
                    : 'bg-white text-slate-950 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              lbs
            </button>
          </div>
        </div>
      </div>

      {/* 3 Milestone Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Month 1 (Wk 4) */}
        <div
          className={`p-2.5 sm:p-3 rounded-2xl border ${
            isDark ? 'bg-[#171b23] border-[#252c38]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-400">
            <span>4 Weeks (1 Mo)</span>
            <Calendar className="w-3 h-3 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black">
              {chartUnit === 'lbs' ? week4Point?.weightLbs : week4Point?.weightKg}
            </span>
            <span className="text-[10px] text-slate-400">{chartUnit}</span>
          </div>
          <span
            className={`text-[10px] font-semibold block ${
              week4Point && (chartUnit === 'lbs' ? week4Point.changeLbs : week4Point.changeKg) < 0
                ? 'text-emerald-500'
                : week4Point && (chartUnit === 'lbs' ? week4Point.changeLbs : week4Point.changeKg) > 0
                ? 'text-blue-500'
                : 'text-slate-400'
            }`}
          >
            {week4Point && (chartUnit === 'lbs' ? week4Point.changeLbs : week4Point.changeKg) > 0 ? '+' : ''}
            {chartUnit === 'lbs' ? week4Point?.changeLbs : week4Point?.changeKg} {chartUnit}
          </span>
        </div>

        {/* Month 2 (Wk 8) */}
        <div
          className={`p-2.5 sm:p-3 rounded-2xl border ${
            isDark ? 'bg-[#171b23] border-[#252c38]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-400">
            <span>8 Weeks (2 Mo)</span>
            <Calendar className="w-3 h-3 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black">
              {chartUnit === 'lbs' ? week8Point?.weightLbs : week8Point?.weightKg}
            </span>
            <span className="text-[10px] text-slate-400">{chartUnit}</span>
          </div>
          <span
            className={`text-[10px] font-semibold block ${
              week8Point && (chartUnit === 'lbs' ? week8Point.changeLbs : week8Point.changeKg) < 0
                ? 'text-emerald-500'
                : week8Point && (chartUnit === 'lbs' ? week8Point.changeLbs : week8Point.changeKg) > 0
                ? 'text-blue-500'
                : 'text-slate-400'
            }`}
          >
            {week8Point && (chartUnit === 'lbs' ? week8Point.changeLbs : week8Point.changeKg) > 0 ? '+' : ''}
            {chartUnit === 'lbs' ? week8Point?.changeLbs : week8Point?.changeKg} {chartUnit}
          </span>
        </div>

        {/* 12-Week Outcome */}
        <div
          className={`p-2.5 sm:p-3 rounded-2xl border ${
            isDark
              ? 'bg-[#19222e] border-blue-500/30'
              : 'bg-emerald-50/60 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-400">
            <span className={isDark ? 'text-blue-300' : 'text-emerald-800'}>12-Wk Forecast</span>
            <Sparkles className={`w-3 h-3 ${isDark ? 'text-blue-400' : 'text-emerald-600'}`} />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {endVal}
            </span>
            <span className="text-[10px] text-slate-400">{chartUnit}</span>
          </div>
          <span
            className={`text-[10px] font-bold block ${
              (totalProjectedDiff || 0) < 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : (totalProjectedDiff || 0) > 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-400'
            }`}
          >
            {(totalProjectedDiff || 0) > 0 ? '+' : ''}
            {totalProjectedDiff} {chartUnit} net
          </span>
        </div>
      </div>

      {/* Recharts Line / Area Chart */}
      <div className="w-full h-56 sm:h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="maintainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#232936' : '#e2e8f0'}
              vertical={false}
            />

            <XAxis
              dataKey="weekLabel"
              stroke={isDark ? '#64748b' : '#94a3b8'}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#232936' : '#e2e8f0' }}
            />

            <YAxis
              domain={[minVal, maxVal]}
              stroke={isDark ? '#64748b' : '#94a3b8'}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#232936' : '#e2e8f0' }}
              tickFormatter={(val) => `${val}`}
            />

            {/* Custom Tooltip */}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload as ProjectionDataPoint;
                  const currentVal = chartUnit === 'lbs' ? p.weightLbs : p.weightKg;
                  const changeVal = chartUnit === 'lbs' ? p.changeLbs : p.changeKg;

                  return (
                    <div
                      className={`p-3 rounded-2xl border text-xs shadow-xl backdrop-blur-md space-y-1.5 ${
                        isDark
                          ? 'bg-[#0f1218]/95 border-[#283142] text-white shadow-black/80'
                          : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 font-bold border-b pb-1 border-slate-200/40">
                        <span>{p.week === 0 ? 'Starting Point' : `Week ${p.week}`}</span>
                        <span className="text-[10px] text-slate-400">
                          {p.week === 0 ? 'Today' : `Month ${(p.week / 4).toFixed(1)}`}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-4 pt-0.5">
                        <span className="text-slate-400">Projected Weight:</span>
                        <span className="font-extrabold text-sm">
                          {currentVal} {chartUnit}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-slate-400">Cumulative Change:</span>
                        <span
                          className={`font-bold ${
                            changeVal < 0
                              ? 'text-emerald-400'
                              : changeVal > 0
                              ? 'text-blue-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {changeVal > 0 ? `+${changeVal}` : changeVal} {chartUnit}
                        </span>
                      </div>

                      {showComparison && (
                        <div className="pt-1.5 mt-1 border-t border-slate-200/30 space-y-0.5 text-[10px]">
                          {typeof p.mild === 'number' && (
                            <div className="flex justify-between text-blue-400">
                              <span>Mild Pace:</span>
                              <span className="font-semibold">{p.mild} {chartUnit}</span>
                            </div>
                          )}
                          {typeof p.standard === 'number' && (
                            <div className="flex justify-between text-emerald-400">
                              <span>Standard Pace:</span>
                              <span className="font-semibold">{p.standard} {chartUnit}</span>
                            </div>
                          )}
                          {typeof p.aggressive === 'number' && (
                            <div className="flex justify-between text-amber-400">
                              <span>Aggressive Pace:</span>
                              <span className="font-semibold">{p.aggressive} {chartUnit}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Target weight reference line if provided by user */}
            {targetWeightKg && Number(targetWeightKg) > 0 && (
              <ReferenceLine
                y={
                  chartUnit === 'lbs'
                    ? Number((Number(targetWeightKg) * 2.20462).toFixed(1))
                    : Number(targetWeightKg)
                }
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: `Target: ${targetWeightKg} kg`,
                  fill: '#f59e0b',
                  fontSize: 10,
                  position: 'right',
                }}
              />
            )}

            {/* Comparison Lines if active */}
            {showComparison && (
              <>
                <Line
                  type="monotone"
                  dataKey="mild"
                  name="Mild Pace"
                  stroke="#60a5fa"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="standard"
                  name="Standard Pace"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="aggressive"
                  name="Aggressive Pace"
                  stroke="#fbbf24"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </>
            )}

            {/* Active Selected Tier Main Trajectory Line */}
            <Area
              type="monotone"
              dataKey="mainValue"
              stroke={strokeColor}
              strokeWidth={3}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 6, stroke: strokeColor, strokeWidth: 2, fill: isDark ? '#10141d' : '#ffffff' }}
              dot={(props) => {
                const { cx, cy, index } = props;
                // Render visible milestone dots at week 0, 4, 8, 12
                if (index === 0 || index === 4 || index === 8 || index === 12) {
                  return (
                    <circle
                      key={`dot-${index}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={strokeColor}
                      stroke={isDark ? '#0e1218' : '#ffffff'}
                      strokeWidth={2}
                    />
                  );
                }
                return <React.Fragment key={`dot-${index}`} />;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info note */}
      <div
        className={`pt-2 border-t flex items-center gap-2 text-[11px] ${
          isDark ? 'border-[#222834] text-slate-400' : 'border-slate-100 text-slate-500'
        }`}
      >
        <Info className="w-3.5 h-3.5 shrink-0 opacity-70" />
        <span>
          Linear projection based on the 7,700 kcal / kg adipose tissue energy standard assuming regular adherence.
        </span>
      </div>
    </div>
  );
};
