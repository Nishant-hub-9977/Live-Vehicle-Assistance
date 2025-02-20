import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Car, Wrench, ShieldCheck, LogOut, User } from "lucide-react";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const roleIcon = {
    client: <Car className="h-5 w-5" />,
    mechanic: <Wrench className="h-5 w-5" />,
    admin: <ShieldCheck className="h-5 w-5" />
  }[user.role];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {roleIcon}
            <h1 className="font-semibold text-lg">Roadside Assistance</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user.username}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logoutMutation.mutate();
                setLocation("/auth");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
