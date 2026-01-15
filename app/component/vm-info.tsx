import { Box } from "lucide-react";
import { useEffect, useState } from "react";
interface VMInfo {
    instanceId: string;
    status: 'Running' | 'Stopped' | 'Provisioning';
    region: string;
    ip: string;
    os: string;
    kernel: string;
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL

const VMInfoCard = () => {
    const [loading, setLoading] = useState(true)
    const [vmInfo, setVmInfo] = useState<VMInfo | null>(null)
    useEffect(() => {
        const getData = async () => {
            try {
                const res = await fetch(baseUrl + '/api/vm-info')
                const result = await res.json()
                console.log(result)
                if (result.success) {
                    setVmInfo(result.data)
                }
            } catch (error) {
                console.log(error)
            } finally {
                setLoading(false)
            }
        }
        getData()
    }, [])
    if (loading) {
        return <div className="bg-white min-h-24 w-full content-center text-center rounded-xl border border-gray-200 p-6 shadow-sm">
            Loading...
        </div>
    }
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Instance Details</h3>
                <div className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200">
                    {vmInfo?.status}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Instance ID</span>
                    <span className="text-gray-900 font-mono text-sm">{vmInfo?.instanceId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">OS</span>
                    <span className="text-gray-900 text-sm flex items-center gap-2">
                        <Box size={14} className="text-indigo-500" /> {vmInfo?.os}
                    </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Public IP</span>
                    <span className="text-gray-900 font-mono text-sm">{vmInfo?.ip}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 text-sm">Region</span>
                    <span className="text-gray-900 text-sm">{vmInfo?.region}</span>
                </div>
            </div>
        </div>
    )
}

export default VMInfoCard;