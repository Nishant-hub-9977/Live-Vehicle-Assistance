import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertServiceRequestSchema, type ServiceRequest } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Clock, AlertCircle, Car, Wrench, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { LocationPicker } from "@/components/maps/location-picker";
import { ServiceTracker } from "@/components/maps/service-tracker";
import { type Mechanic } from "@shared/schema";

export default function DashboardClient() {
  const { toast } = useToast();

  const { data: requests, isLoading: isLoadingRequests } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
  });

  const activeRequest = requests?.find(r => r.status !== 'completed');

  const { data: activeMechanic } = useQuery<Mechanic>({
    queryKey: ["/api/mechanics", activeRequest?.mechanicId],
    enabled: !!activeRequest?.mechanicId,
  });

  const form = useForm({
    resolver: zodResolver(insertServiceRequestSchema.omit({ clientId: true, status: true })),
    defaultValues: {
      location: { lat: 0, lng: 0 },
      description: "",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/service-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({ title: "Service request created successfully" });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create service request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const statusColors = {
    pending: "bg-yellow-500",
    accepted: "bg-blue-500",
    completed: "bg-green-500",
  };

  return (
    <DashboardLayout>
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Active Request Status */}
          {activeRequest ? (
            <div className="space-y-8">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Active Service Request
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs text-white font-medium ${
                        statusColors[activeRequest.status as keyof typeof statusColors]
                      }`}>
                        {activeRequest.status.toUpperCase()}
                      </span>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(activeRequest.created), "HH:mm")}
                      </div>
                    </div>
                    <p className="text-sm">{activeRequest.description}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      Current Location
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Tracking Map */}
              {activeRequest.status !== 'pending' && activeMechanic && (
                <ServiceTracker 
                  serviceRequest={activeRequest}
                  mechanicLocation={activeMechanic.activeLocation}
                />
              )}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Request Assistance</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) => createRequestMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What's the issue?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your vehicle problem..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Location</FormLabel>
                          <FormControl>
                            <LocationPicker
                              onLocationSelect={(location) => {
                                field.onChange(location);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createRequestMutation.isPending}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Request Assistance
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Service Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Service Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-3xl font-bold">{requests?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-3xl font-bold">
                    {requests?.filter(r => r.status === 'completed').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Service History */}
        <Card>
          <CardHeader>
            <CardTitle>Service History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRequests ? (
              <div className="flex items-center justify-center p-8">
                <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : requests?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                <p>No service requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests?.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border rounded-lg space-y-2 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-xs text-white font-medium ${
                        statusColors[request.status as keyof typeof statusColors]
                      }`}>
                        {request.status.toUpperCase()}
                      </span>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(request.created), "MMM d, yyyy")}
                      </div>
                    </div>
                    <p className="text-sm">{request.description}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {request.location.lat.toFixed(6)}, {request.location.lng.toFixed(6)}
                    </div>
                    {request.status === 'completed' && (
                      <div className="flex items-center text-sm text-green-500">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Service Completed
                      </div>
                    )}
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