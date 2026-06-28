import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shield } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      login(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      {/* Glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(195,100%,50%)]/[0.04] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[hsl(195,100%,50%)] to-[hsl(210,100%,40%)] flex items-center justify-center shadow-xl shadow-[hsl(195,100%,50%)/25%] mb-5">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AISecPipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">AI Security Platform</p>
        </div>

        <div className="bg-[hsl(222,18%,8%)] border border-[hsl(222,16%,14%)] rounded-xl shadow-2xl p-6">
          <h2 className="text-lg font-semibold mb-5 text-[hsl(210,20%,92%)]">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(222,12%,60%)] uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[hsl(222,20%,5%)] border border-[hsl(222,16%,14%)] text-sm text-[hsl(210,20%,90%)] placeholder:text-[hsl(222,12%,35%)] focus:outline-none focus:ring-1 focus:ring-[hsl(195,100%,50%)] focus:border-[hsl(195,100%,50%)] transition-colors"
                placeholder="Enter username"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(222,12%,60%)] uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[hsl(222,20%,5%)] border border-[hsl(222,16%,14%)] text-sm text-[hsl(210,20%,90%)] placeholder:text-[hsl(222,12%,35%)] focus:outline-none focus:ring-1 focus:ring-[hsl(195,100%,50%)] focus:border-[hsl(195,100%,50%)] transition-colors"
                placeholder="Enter password"
                required
              />
            </div>
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[hsl(195,100%,50%)] to-[hsl(210,100%,45%)] text-white text-sm font-semibold hover:from-[hsl(195,100%,55%)] hover:to-[hsl(210,100%,50%)] disabled:opacity-50 transition-all shadow-lg shadow-[hsl(195,100%,50%)/20%]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
