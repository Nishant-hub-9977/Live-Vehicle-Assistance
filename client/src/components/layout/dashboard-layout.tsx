import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Car,
  Wrench,
  ShieldCheck,
  LogOut,
  User,
  MapPin,
  Clock,
  CreditCard,
  Settings,
  Sun,
  Moon
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  if (!user) return null;

  const roleIcon = {
    client: <Car className="h-5 w-5" />,
    mechanic: <Wrench className="h-5 w-5" />,
    admin: <ShieldCheck className="h-5 w-5" />
  }[user.role];

  // Ensure navigationItems is always defined based on user role
  const navigationItems = user.role === 'client' ? [
    { icon: <MapPin className="h-5 w-5" />, label: "Request Service", href: "/dashboard/client" },
    { icon: <Clock className="h-5 w-5" />, label: "Service History", href: "/dashboard/client/history" },
    { icon: <CreditCard className="h-5 w-5" />, label: "Payments", href: "/dashboard/client/payments" },
  ] : user.role === 'mechanic' ? [
    { icon: <MapPin className="h-5 w-5" />, label: "Active Requests", href: "/dashboard/mechanic" },
    { icon: <Clock className="h-5 w-5" />, label: "Service History", href: "/dashboard/mechanic/history" },
    { icon: <CreditCard className="h-5 w-5" />, label: "Earnings", href: "/dashboard/mechanic/earnings" },
  ] : [
    { icon: <MapPin className="h-5 w-5" />, label: "All Services", href: "/dashboard/admin" },
    { icon: <Wrench className="h-5 w-5" />, label: "Mechanics", href: "/dashboard/admin/mechanics" },
    { icon: <CreditCard className="h-5 w-5" />, label: "Transactions", href: "/dashboard/admin/transactions" },
  ];

  return (
    <div className="min-h-screen flex dark:bg-gray-900">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 bg-card border-r z-30 transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center gap-3">
            {roleIcon}
            {isSidebarOpen && <h1 className="font-semibold text-lg">Roadside Assist</h1>}
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigationItems.map((item, index) => (
                <li key={index}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      !isSidebarOpen && "justify-center"
                    )}
                    onClick={() => setLocation(item.href)}
                  >
                    {item.icon}
                    {isSidebarOpen && <span className="ml-3">{item.label}</span>}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-muted-foreground" />
              {isSidebarOpen && <span className="text-sm text-muted-foreground">{user.username}</span>}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className={cn("flex-1", !isSidebarOpen && "p-0")}
                onClick={() => {
                  logoutMutation.mutate();
                  setLocation("/auth");
                }}
              >
                <LogOut className="h-4 w-4" />
                {isSidebarOpen && <span className="ml-2">Logout</span>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isSidebarOpen ? "ml-64" : "ml-20"
      )}>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}