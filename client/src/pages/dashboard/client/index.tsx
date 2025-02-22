import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function ClientDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Request Service</h1>
        <p>Welcome to your dashboard. Request roadside assistance here.</p>
        {/* Service request form will be added here */}
      </div>
    </DashboardLayout>
  );
}
