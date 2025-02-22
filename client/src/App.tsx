import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";

// Import dashboard components
import ClientDashboard from "./pages/dashboard/client";
import MechanicDashboard from "./pages/dashboard/mechanic";
import AdminDashboard from "./pages/dashboard/admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => {
        return <AuthPage />;
      }} />
      <Route path="/auth" component={AuthPage} />

      {/* Client Routes */}
      <ProtectedRoute path="/dashboard/client" component={ClientDashboard} />
      <ProtectedRoute path="/dashboard/client/history" component={() => <ClientDashboard />} />
      <ProtectedRoute path="/dashboard/client/payments" component={() => <ClientDashboard />} />

      {/* Mechanic Routes */}
      <ProtectedRoute path="/dashboard/mechanic" component={MechanicDashboard} />
      <ProtectedRoute path="/dashboard/mechanic/history" component={() => <MechanicDashboard />} />
      <ProtectedRoute path="/dashboard/mechanic/earnings" component={() => <MechanicDashboard />} />

      {/* Admin Routes */}
      <ProtectedRoute path="/dashboard/admin" component={AdminDashboard} />
      <ProtectedRoute path="/dashboard/admin/mechanics" component={() => <AdminDashboard />} />
      <ProtectedRoute path="/dashboard/admin/transactions" component={() => <AdminDashboard />} />

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