import { MoreVertical, Terminal } from "lucide-react";
import { Process } from "../page";

const ProcessList = ({ processes }: { processes: Process[] }) => {
    return (
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
    )
}

export default ProcessList;