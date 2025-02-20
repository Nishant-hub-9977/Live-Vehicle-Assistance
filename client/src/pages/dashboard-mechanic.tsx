import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type ServiceRequest, type Mechanic } from "@shared/schema";
import { MapPin, Calendar, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function DashboardMechanic() {
  const { toast } = useToast();

  const { data: requests } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
  });

  const { data: mechanic } = useQuery<Mechanic>({
    queryKey: ["/api/mechanics/me"],
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest("PATCH", `/api/service-requests/${requestId}`, {
        status: "accepted",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({ title: "Request accepted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest("PATCH", `/api/service-requests/${requestId}`, {
        status: "completed",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({ title: "Request marked as completed" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!mechanic?.approved) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Account Pending Approval</h2>
              <p className="text-muted-foreground">
                Your account is currently under review. You'll be able to accept service
                requests once an administrator approves your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Available Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests?.map((request) => (
              <div
                key={request.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(request.created), "MMM d, yyyy")}
                    <Clock className="h-4 w-4 ml-4 mr-1" />
                    {format(new Date(request.created), "HH:mm")}
                  </div>
                  {request.status === "pending" ? (
                    <Button
                      size="sm"
                      onClick={() => acceptRequestMutation.mutate(request.id)}
                      disabled={acceptRequestMutation.isPending}
                    >
                      Accept Request
                    </Button>
                  ) : request.status === "accepted" ? (
                    <Button
                      size="sm"
                      onClick={() => completeRequestMutation.mutate(request.id)}
                      disabled={completeRequestMutation.isPending}
                    >
                      Mark as Complete
                    </Button>
                  ) : (
                    <span className="flex items-center text-green-500">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Completed
                    </span>
                  )}
                </div>
                <p className="text-sm">{request.description}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {request.location.lat.toFixed(6)}, {request.location.lng.toFixed(6)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
