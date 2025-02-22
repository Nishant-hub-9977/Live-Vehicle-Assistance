import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">All Services</h1>
        <p>Monitor and manage all service requests.</p>
        {/* Service management interface will be added here */}
      </div>
    </DashboardLayout>
  );
}
