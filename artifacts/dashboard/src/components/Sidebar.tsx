import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, FileText, FileBarChart, Users,
  Activity, Plug, Settings, Shield, Sun, Moon, LogOut, ChevronDown, CalendarDays,
  Bug, Target, BookOpen, Bell, Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

const navSections = [
  {
    label: "Menu Utama",
    items: [
      { href: "/",              label: "Dashboard",       icon: LayoutDashboard },
      { href: "/sessions",      label: "Sessions",        icon: FileText },
      { href: "/reports",       label: "Reports",         icon: FileBarChart },
      { href: "/daily-summary", label: "Daily Summaries",  icon: CalendarDays },
    ],
  },
  {
    label: "Layanan",
    items: [
      { href: "/wazuh",         label: "Wazuh",           icon: Shield },
      { href: "/thehive",       label: "TheHive",         icon: Bug },
      { href: "/velociraptor",  label: "Velociraptor",    icon: Search },
    ],
  },
  {
    label: "Keamanan",
    items: [
      { href: "/mitre",         label: "MITRE ATT&CK",    icon: Target },
      { href: "/playbooks",     label: "SOAR Playbooks",  icon: BookOpen },
      { href: "/alerts",        label: "Alerts",          icon: Bell },
    ],
  },
  {
    label: "Bantuan & Profil",
    items: [
      { href: "/connectors",    label: "Connectors",      icon: Plug },
      { href: "/users",         label: "Users",           icon: Users },
      { href: "/usage",         label: "Usage",           icon: Activity },
      { href: "/settings",      label: "Settings",        icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [location]        = useLocation();
  const { logout, user }  = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <aside className="w-64 bg-[hsl(222,22%,7%)] border-r border-[hsl(222,16%,13%)] flex flex-col">
      {/* Logo - gradient bar */}
      <div className="px-5 py-5 border-b border-[hsl(222,16%,13%)]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(195,100%,50%)] to-[hsl(210,100%,40%)] flex items-center justify-center shadow-lg shadow-[hsl(195,100%,50%)/20%]">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">AISecPipeline</h1>
            <p className="text-[10px] text-[hsl(222,12%,45%)] tracking-wide">Security Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-2 pb-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[hsl(222,12%,35%)]">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location === item.href ||
                  (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-all duration-150 text-sm ${
                      isActive
                        ? "bg-[hsl(195,100%,50%)/10] text-[hsl(195,100%,65%)] font-medium"
                        : "text-[hsl(222,12%,52%)] hover:bg-[hsl(222,16%,12%)] hover:text-[hsl(210,20%,85%)]"
                    }`}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-3 pt-3 border-t border-[hsl(222,16%,13%)] space-y-1">
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-[hsl(222,12%,52%)] hover:bg-[hsl(222,16%,12%)] hover:text-[hsl(210,20%,85%)] transition-colors">
          <div className="h-7 w-7 rounded-md bg-[hsl(222,16%,12%)] flex items-center justify-center">
            {theme === "dark"
              ? <Sun className="h-3.5 w-3.5" />
              : <Moon className="h-3.5 w-3.5" />}
          </div>
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <div className="relative">
          <button onClick={() => setUserMenuOpen((o) => !o)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-[hsl(222,12%,52%)] hover:bg-[hsl(222,16%,12%)] hover:text-[hsl(210,20%,85%)] transition-colors">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[hsl(195,100%,50%)] to-[hsl(210,100%,40%)] flex items-center justify-center text-[10px] font-bold text-white">
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username ?? "..."}</p>
              <p className="text-[9px] text-[hsl(222,12%,45%)] capitalize">{user?.role ?? ""}</p>
            </div>
            <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-[hsl(222,22%,9%)] border border-[hsl(222,16%,15%)] rounded-lg shadow-2xl overflow-hidden z-50">
              <button
                onClick={() => { logout(); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accent bar */}
      <div className="h-[2px] bg-gradient-to-r from-[hsl(195,100%,50%)] via-[hsl(210,100%,60%)] to-transparent" />
    </aside>
  );
}
