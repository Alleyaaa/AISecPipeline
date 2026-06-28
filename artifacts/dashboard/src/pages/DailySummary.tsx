import { TrendingUp, Activity, Bell } from "lucide-react";

export default function DailySummary() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Daily Summary</h1>
      <div className="grid grid-cols-2 gap-4">
         <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Threat Overview</h2>
            <div className="space-y-3">
               <div className="flex justify-between text-xs"><span>New Threats</span><span className="text-cyan-400">12</span></div>
               <div className="flex justify-between text-xs"><span>Resolved</span><span className="text-emerald-400">45</span></div>
            </div>
         </div>
         <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-5">
            <h2 className="text-sm font-semibold text-white mb-4">System Activity</h2>
            <div className="space-y-3">
               <div className="flex justify-between text-xs"><span>API Calls</span><span className="text-white">1.2M</span></div>
               <div className="flex justify-between text-xs"><span>Avg Response</span><span className="text-white">45ms</span></div>
            </div>
         </div>
      </div>
    </div>
  );
}
