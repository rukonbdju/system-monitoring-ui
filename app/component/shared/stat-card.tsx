import { ArrowDown, ArrowUp } from "lucide-react";
export const Sparkline = ({ data, color = "#3b82f6", height = 60 }: { data: number[], color?: string, height?: number }) => {
    const max = 100;
    const min = 0;
    const width = 200;

    if (data.length < 2) return null;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / (max - min)) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <defs>
                <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path
                d={`M0,${height} L${points} L${width},${height} Z`}
                fill={`url(#grad-${color})`}
                stroke="none"
            />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
export const StatCard = ({ title, value, subValue, icon: Icon, trend, trendValue, color, chartData }: any) => {
    return (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
                    <div className="text-3xl font-bold text-gray-900 tracking-tight">{value}</div>
                    {subValue && <div className="text-gray-400 text-xs mt-1">{subValue}</div>}
                </div>
                <div className={`p-3 rounded-lg bg-opacity-10 ${color.bg} ${color.text}`}>
                    <Icon size={24} />
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative h-16 mt-4">
                <Sparkline data={chartData} color={color.hex} />
            </div>

            {/* Trend Info */}
            <div className="flex items-center mt-3 text-xs font-medium">
                {trend === 'up' ? (
                    <span className="text-emerald-600 flex items-center bg-emerald-100 px-2 py-0.5 rounded-full">
                        <ArrowUp size={12} className="mr-1" /> {trendValue}
                    </span>
                ) : (
                    <span className="text-rose-600 flex items-center bg-rose-100 px-2 py-0.5 rounded-full">
                        <ArrowDown size={12} className="mr-1" /> {trendValue}
                    </span>
                )}
                <span className="text-gray-400 ml-2">vs last hour</span>
            </div>
        </div>
    );
};