import React, { memo, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer } from 'recharts';

const Sparkline = memo(({
  data = [],
  color = '#047857',
  height = 40,
  showDots = false,
  showArea = false,
}) => {
  const id = useMemo(() => `spark-${Math.random().toString(36).slice(2, 8)}`, []);

  const normalizedData = useMemo(() =>
    data.map((d, i) => ({
      value: typeof d === 'number' ? d : d.value,
      index: i,
    })),
  [data]);

  if (normalizedData.length < 2) {
    return <div className="w-full" style={{ height }} />;
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {showArea ? (
          <AreaChart data={normalizedData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${id})`}
              dot={showDots ? { r: 2, fill: color } : false}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <LineChart data={normalizedData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={showDots ? { r: 2, fill: color } : false}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
});

Sparkline.displayName = 'Sparkline';
export default Sparkline;
