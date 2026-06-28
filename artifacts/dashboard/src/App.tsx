import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Sessions from "@/pages/Sessions";
import SessionWorkspace from "@/pages/SessionWorkspace";
import SessionTimeline from "@/pages/SessionTimeline";
import Reports from "@/pages/Reports";
import ReportDetail from "@/pages/ReportDetail";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users";
import Usage from "@/pages/Usage";
import Connectors from "@/pages/Connectors";
import DailySummary from "@/pages/DailySummary";
import Wazuh from "@/pages/Wazuh";
import TheHive from "@/pages/TheHive";
import Velociraptor from "@/pages/Velociraptor";
import Mitre from "@/pages/Mitre";
import Playbooks from "@/pages/Playbooks";
import AlertsPage from "@/pages/AlertsPage";
import Login from "@/pages/Login";
import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const queryClient = new QueryClient();

function ProtectedRouter() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/sessions" component={Sessions} />
        <Route path="/sessions/:id/timeline" component={SessionTimeline} />
        <Route path="/sessions/:id" component={SessionWorkspace} />
        <Route path="/reports" component={Reports} />
        <Route path="/reports/:id" component={ReportDetail} />
        <Route path="/users" component={Users} />
        <Route path="/usage" component={Usage} />
        <Route path="/daily-summary" component={DailySummary} />
        <Route path="/connectors" component={Connectors} />
        <Route path="/settings" component={Settings} />
        <Route path="/wazuh" component={Wazuh} />
        <Route path="/thehive" component={TheHive} />
        <Route path="/velociraptor" component={Velociraptor} />
        <Route path="/mitre" component={Mitre} />
        <Route path="/playbooks" component={Playbooks} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/daily-summary" component={DailySummary} />
        <Route path="/sessions" component={Sessions} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <ProtectedRouter />
            </WouterRouter>
            <Toaster position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
