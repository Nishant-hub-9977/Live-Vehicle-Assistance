import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Mechanic, type ServiceRequest } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, FileText, AlertCircle } from "lucide-react";

export default function DashboardAdmin() {
  const { toast } = useToast();

  const { data: pendingMechanics } = useQuery<Mechanic[]>({
    queryKey: ["/api/mechanics/pending"],
  });

  const { data: requests } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
  });

  const approveMechanicMutation = useMutation({
    mutationFn: async (mechanicId: number) => {
      const res = await apiRequest("PATCH", `/api/mechanics/${mechanicId}`, {
        approved: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mechanics/pending"] });
      toast({ title: "Mechanic approved successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve mechanic",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMechanicMutation = useMutation({
    mutationFn: async (mechanicId: number) => {
      const res = await apiRequest("DELETE", `/api/mechanics/${mechanicId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mechanics/pending"] });
      toast({ title: "Mechanic rejected" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject mechanic",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <DashboardLayout>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Mechanic Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {!pendingMechanics?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="mx-auto h-8 w-8 mb-2" />
                <p>No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingMechanics.map((mechanic) => (
                  <div
                    key={mechanic.id}
                    className="p-4 border rounded-lg space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">Mechanic #{mechanic.userId}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <FileText className="h-4 w-4 mr-1" />
                          {mechanic.documents?.length || 0} documents uploaded
                        </div>
                      </div>
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMechanicMutation.mutate(mechanic.id)}
                          disabled={rejectMechanicMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveMechanicMutation.mutate(mechanic.id)}
                          disabled={approveMechanicMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Requests Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {!requests?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                <p>No service requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Request #{request.id}
                          </span>
                          <Badge
                            variant={
                              request.status === "completed"
                                ? "default"
                                : request.status === "accepted"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Client #{request.clientId}
                          {request.mechanicId && ` • Mechanic #${request.mechanicId}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm">{request.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
