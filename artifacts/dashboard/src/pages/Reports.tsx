import { Download, FileText, Search } from "lucide-react";

const reports = [
  { id: "REP-001", title: "Monthly Security Posture", date: "2026-06-25", type: "Executive", author: "System" },
  { id: "REP-002", title: "Ransomware Cleanup Log", date: "2026-06-28", type: "Technical", author: "Admin" },
];

export default function Reports() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">AI Analysis Reports</h1>
      <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-5">
         {reports.map(r => (
            <div key={r.id} className="flex items-center justify-between py-3 border-b border-[hsl(222,16%,14%)] last:border-0">
               <div className="flex items-center gap-3">
                 <FileText className="h-5 w-5 text-cyan-400" />
                 <div>
                   <p className="font-medium text-white">{r.title}</p>
                   <p className="text-xs text-[hsl(222,12%,52%)]">{r.type} • {r.date}</p>
                 </div>
               </div>
               <Download className="h-4 w-4 text-[hsl(222,12%,45%)] cursor-pointer hover:text-white" />
            </div>
         ))}
      </div>
    </div>
  );
}
