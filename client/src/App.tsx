import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import DashboardClient from "./pages/dashboard-client";
import DashboardMechanic from "./pages/dashboard-mechanic";
import DashboardAdmin from "./pages/dashboard-admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <AuthPage />} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/dashboard/client" component={DashboardClient} />
      <ProtectedRoute path="/dashboard/mechanic" component={DashboardMechanic} />
      <ProtectedRoute path="/dashboard/admin" component={DashboardAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;