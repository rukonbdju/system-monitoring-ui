'use client';
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client'; // Add this import
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Clock,
  Terminal,
  ArrowUp,
  ArrowDown,
  Zap,
  Box,
  MoreVertical
} from 'lucide-react';

// --- Types ---

interface SystemStats {
  cpuUsage: number;
  cpuTemp: number;
  memoryUsed: number;
  memoryTotal: number;
  storageUsed: number;
  storageTotal: number;
  networkUp: number; // Mbps
  networkDown: number; // Mbps
  uptime: number; // seconds
}

interface Process {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  mem: number;
  status: 'Running' | 'Sleeping' | 'Zombie';
}

interface VMInfo {
  instanceId: string;
  status: 'Running' | 'Stopped' | 'Provisioning';
  region: string;
  ip: string;
  os: string;
  kernel: string;
}

// --- Mock Data Generators ---

const generateInitialHistory = (length: number) => Array(length).fill(0).map(() => Math.random() * 30 + 10);

// --- Components ---

/**
 * A lightweight SVG Sparkline chart for history visualization
 */
const Sparkline = ({ data, color = "#3b82f6", height = 60 }: { data: number[], color?: string, height?: number }) => {
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

/**
 * Circular Progress Bar for metrics like Storage/RAM
 */
const CircularProgress = ({ percentage, color, icon: Icon, label, subLabel }: { percentage: number, color: string, icon: any, label: string, subLabel: string }) => {
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

/**
 * Main Status Card
 */
const StatCard = ({ title, value, subValue, icon: Icon, trend, trendValue, color, chartData }: any) => {
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

export default function App() {
  // State
  const [stats, setStats] = useState<SystemStats>({
    cpuUsage: 0,
    cpuTemp: 0,
    memoryUsed: 0,
    memoryTotal: 16,
    storageUsed: 0,
    storageTotal: 512,
    networkUp: 0,
    networkDown: 0,
    uptime: 0
  });

  const [cpuHistory, setCpuHistory] = useState<number[]>(generateInitialHistory(20));
  const [memHistory, setMemHistory] = useState<number[]>(generateInitialHistory(20));
  const [netHistory, setNetHistory] = useState<number[]>(generateInitialHistory(20));
  const [processes, setProcesses] = useState<Process[]>([]); // Add state for processes

  // Constants
  const vmInfo: VMInfo = {
    instanceId: 'i-0fac2b3d12a9',
    status: 'Running',
    region: 'us-east-1a',
    ip: '192.168.1.14',
    os: 'Ubuntu 24.04 LTS',
    kernel: '5.15.0-72-generic'
  };

  // Real Socket.io Connection
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL);

    socket.on('connect', () => {
      console.log('Connected to monitoring server');
    });

    socket.on('stats', (newStats: SystemStats) => {
      setStats(newStats);

      // Update charts
      setCpuHistory(h => [...h.slice(1), newStats.cpuUsage]);
      setMemHistory(h => [...h.slice(1), (newStats.memoryUsed / newStats.memoryTotal) * 100]);
      setNetHistory(h => [...h.slice(1), newStats.networkDown]);
    });

    socket.on('processes', (newProcesses: Process[]) => {
      setProcesses(newProcesses);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Format Helpers
  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100">

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto p-6 sm:p-8 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Overview</h1>
            <p className="text-gray-500 mt-1">Real-time monitoring for {vmInfo.instanceId}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 flex items-center gap-2 bg-white py-1.5 px-3 rounded-md border border-gray-200 shadow-sm">
              <Clock size={14} />
              Uptime: <span className="text-gray-900 font-mono">{formatTime(stats.uptime)}</span>
            </span>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
              Generate Report
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="CPU Usage"
            value={`${stats.cpuUsage.toFixed(1)}%`}
            subValue={`${stats.cpuTemp.toFixed(1)}°C Temperature`}
            icon={Cpu}
            trend={stats.cpuUsage > 50 ? 'up' : 'down'}
            trendValue="2.4%"
            chartData={cpuHistory}
            color={{ bg: 'bg-indigo-500', text: 'text-indigo-600', hex: '#4f46e5' }}
          />
          <StatCard
            title="Memory Usage"
            value={`${stats.memoryUsed.toFixed(1)} GB`}
            subValue={`of ${stats.memoryTotal} GB Total`}
            icon={MemoryStick}
            trend="up"
            trendValue="1.2%"
            chartData={memHistory}
            color={{ bg: 'bg-purple-500', text: 'text-purple-600', hex: '#9333ea' }}
          />
          <StatCard
            title="Disk I/O"
            value="45.2 MB/s"
            subValue="Read / Write Mix"
            icon={HardDrive}
            trend="down"
            trendValue="5.1%"
            chartData={generateInitialHistory(20)}
            color={{ bg: 'bg-cyan-500', text: 'text-cyan-600', hex: '#0891b2' }}
          />
          <StatCard
            title="Network Traffic"
            value={`${stats.networkDown.toFixed(1)} Mbps`}
            subValue={`Up: ${stats.networkUp.toFixed(1)} Mbps`}
            icon={Wifi}
            trend="up"
            trendValue="12%"
            chartData={netHistory}
            color={{ bg: 'bg-emerald-500', text: 'text-emerald-600', hex: '#059669' }}
          />
        </div>

        {/* Second Row: Detailed Charts & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Chart Area */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Traffic Analysis</h3>
                <p className="text-sm text-gray-500">Inbound vs Outbound traffic over the last hour</p>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                {['1H', '24H', '7D'].map(t => (
                  <button key={t} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${t === '1H' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full bg-gray-50 rounded-lg border border-gray-100 relative flex items-end justify-between px-2 pb-2 gap-1 overflow-hidden">
              {/* CSS Bar Chart Simulation */}
              {netHistory.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-1 h-full group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {val.toFixed(1)} Mbps
                  </div>
                  <div
                    style={{ height: `${val}%` }}
                    className="w-full bg-indigo-500/80 rounded-t-sm hover:bg-indigo-600 transition-colors"
                  />
                  <div
                    style={{ height: `${val * 0.6}%` }}
                    className="w-full bg-purple-500/50 rounded-b-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> Inbound</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500/50 rounded-sm"></div> Outbound</div>
            </div>
          </div>

          {/* Instance Info & Health */}
          <div className="space-y-6">
            {/* Instance Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Instance Details</h3>
                <div className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200">
                  {vmInfo.status}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Instance ID</span>
                  <span className="text-gray-900 font-mono text-sm">{vmInfo.instanceId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">OS</span>
                  <span className="text-gray-900 text-sm flex items-center gap-2">
                    <Box size={14} className="text-indigo-500" /> {vmInfo.os}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Public IP</span>
                  <span className="text-gray-900 font-mono text-sm">{vmInfo.ip}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 text-sm">Region</span>
                  <span className="text-gray-900 text-sm">{vmInfo.region}</span>
                </div>
              </div>
            </div>

            {/* Quick Gauges */}
            <div className="grid grid-cols-2 gap-4">
              <CircularProgress
                percentage={(stats.storageUsed / stats.storageTotal) * 100}
                color="#0891b2"
                icon={HardDrive}
                label="Storage"
                subLabel={`${stats.storageTotal - stats.storageUsed}GB Free`}
              />
              <CircularProgress
                percentage={(stats.memoryUsed / stats.memoryTotal) * 100}
                color="#9333ea"
                icon={Zap}
                label="Load"
                subLabel="15 min avg"
              />
            </div>
          </div>
        </div>

        {/* Bottom Row: Processes Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Top Processes</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-gray-700 font-medium">
                <tr>
                  <th className="px-6 py-4">Process Name</th>
                  <th className="px-6 py-4">PID</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">CPU %</th>
                  <th className="px-6 py-4 text-right">Mem %</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {processes.map((proc) => (
                  <tr key={proc.pid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                        <Terminal size={16} />
                      </div>
                      {proc.name}
                    </td>
                    <td className="px-6 py-4 font-mono">{proc.pid}</td>
                    <td className="px-6 py-4">{proc.user}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${proc.status === 'Running'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                        {proc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">{proc.cpu}%</td>
                    <td className="px-6 py-4 text-right text-gray-900">{proc.mem}%</td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-gray-400 hover:text-gray-900 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}