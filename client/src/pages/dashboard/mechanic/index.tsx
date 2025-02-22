import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function MechanicDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Active Requests</h1>
        <p>View and manage active service requests.</p>
        {/* Active requests list will be added here */}
      </div>
    </DashboardLayout>
  );
}
