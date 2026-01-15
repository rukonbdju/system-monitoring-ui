'use client';
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client'; // Add this import
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Clock,
  Zap,
} from 'lucide-react';
import VMInfoCard from './component/vm-info';
import ProcessList from './component/process-list';
import { CircularProgress } from './component/shared/circular-progress';
import { StatCard } from './component/shared/stat-card';

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

export interface Process {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  mem: number;
  status: 'Running' | 'Sleeping' | 'Zombie';
}

// --- Mock Data Generators ---

const generateInitialHistory = (length: number) => Array(length).fill(0).map(() => Math.random() * 30 + 10);

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

  const [cpuHistory, setCpuHistory] = useState<number[]>([0]);
  const [memHistory, setMemHistory] = useState<number[]>([0]);
  const [netHistory, setNetHistory] = useState<number[]>([0]);
  const [processes, setProcesses] = useState<Process[]>([]);
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
      <main className="max-w-480 mx-auto p-6 sm:p-8 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Overview</h1>
            <p className="text-gray-500 mt-1">Real-time monitoring for your server</p>
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
            <VMInfoCard />

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
        <ProcessList processes={processes} />

      </main>
    </div>
  );
}