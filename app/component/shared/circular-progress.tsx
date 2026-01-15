export const CircularProgress = ({ percentage, color, icon: Icon, label, subLabel }: { percentage: number, color: string, icon: any, label: string, subLabel: string }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
            <div className="relative flex items-center justify-center w-20 h-20">
                <svg className="transform -rotate-90 w-20 h-20">
                    <circle
                        className="text-gray-200"
                        strokeWidth="6"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="40"
                        cy="40"
                    />
                    <circle
                        className="transition-all duration-500 ease-out"
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke={color}
                        fill="transparent"
                        r={radius}
                        cx="40"
                        cy="40"
                    />
                </svg>
                <div className="absolute text-gray-400">
                    <Icon size={20} />
                </div>
            </div>
            <div>
                <div className="text-gray-500 text-sm font-medium">{label}</div>
                <div className="text-2xl font-bold text-gray-900">{percentage.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">{subLabel}</div>
            </div>
        </div>
    );
};