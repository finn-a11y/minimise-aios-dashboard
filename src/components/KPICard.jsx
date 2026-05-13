import React, { memo, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight } from './icons';
import Sparkline from './Sparkline';

const KPICard = memo(({
  title,
  value,
  baseline,
  baselineLabel = "Baseline (6-mo avg)",
  delta,
  deltaType = 'percent',
  trend = 'up',
  isPositiveTrend = true,
  sparklineData = [],
  onClick,
  children,
  className = '',
  prominent = false,
}) => {
  const isPositive = isPositiveTrend ? trend === 'up' : trend === 'down';

  const formattedDelta = useMemo(() => {
    if (delta === undefined || delta === null) return null;
    const prefix = trend === 'up' ? '+' : '';
    switch (deltaType) {
      case 'percent': return `${prefix}${delta}%`;
      case 'absolute': return `${prefix}$${Number(delta).toLocaleString()}`;
      case 'pp': return `${prefix}${delta}pp`;
      default: return `${prefix}${delta}`;
    }
  }, [delta, deltaType, trend]);

  return (
    <div
      onClick={onClick}
      className={`${onClick ? 'card-interactive' : 'card'} p-5 sm:p-6 flex flex-col gap-2 ${className}`}
    >
      {/* Header row: label + delta */}
      <div className="flex justify-between items-center gap-2">
        <h3 className="section-label leading-tight">
          {title}
        </h3>
        {formattedDelta && (
          <span
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 shrink-0"
            style={{
              backgroundColor: isPositive ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)',
              color: isPositive ? 'var(--color-positive)' : 'var(--color-negative)',
              borderRadius: 'var(--radius-badge)',
            }}
          >
            {trend === 'up'
              ? <ArrowUpRight size={11} weight="bold" />
              : <ArrowDownRight size={11} weight="bold" />
            }
            {formattedDelta}
          </span>
        )}
      </div>

      {/* Value — large, dominant */}
      <div className="flex items-baseline gap-2 min-w-0 pt-1">
        <span
          className={`${prominent ? 'text-[28px] sm:text-[36px]' : 'text-[26px] sm:text-[32px]'} font-bold tabular-nums tracking-tight leading-none truncate`}
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </span>
      </div>

      {/* Baseline comparison */}
      {baseline && (
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          vs <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{baseline}</span>
          {baselineLabel && <span className="ml-1">&middot; {baselineLabel}</span>}
        </div>
      )}

      {/* Sparkline */}
      {sparklineData.length > 0 && (
        <div className="mt-auto pt-2">
          <Sparkline data={sparklineData} color={isPositive ? 'var(--color-positive)' : 'var(--color-negative)'} height={36} showArea />
        </div>
      )}

      {children}
    </div>
  );
});

KPICard.displayName = 'KPICard';
export default KPICard;
