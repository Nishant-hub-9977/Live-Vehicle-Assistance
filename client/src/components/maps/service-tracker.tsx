import { useState, useEffect, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Navigation } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import type { ServiceRequest } from "@shared/schema";

const containerStyle = {
  width: '100%',
  height: '400px'
};

// Reuse the dark map style from location-picker
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
];

interface ServiceTrackerProps {
  serviceRequest: ServiceRequest;
  mechanicLocation?: { lat: number; lng: number };
  onMechanicLocationUpdate?: (location: { lat: number; lng: number }) => void;
  isMechanic?: boolean;
}

export function ServiceTracker({ 
  serviceRequest, 
  mechanicLocation, 
  onMechanicLocationUpdate,
  isMechanic = false 
}: ServiceTrackerProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [eta, setEta] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);
  const { theme } = useTheme();

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: ["places", "directions"]
  });

  const calculateRoute = useCallback(async () => {
    if (!mechanicLocation) return;

    const directionsService = new google.maps.DirectionsService();
    
    try {
      const result = await directionsService.route({
        origin: mechanicLocation,
        destination: serviceRequest.location,
        travelMode: google.maps.TravelMode.DRIVING
      });

      setDirections(result);
      
      // Calculate ETA
      const duration = result.routes[0]?.legs[0]?.duration?.text;
      if (duration) {
        setEta(duration);
      }
    } catch (error) {
      console.error("Error calculating route:", error);
    }
  }, [mechanicLocation, serviceRequest.location]);

  useEffect(() => {
    if (mechanicLocation) {
      calculateRoute();
    }
  }, [mechanicLocation, calculateRoute]);

  // Real-time location tracking for mechanics
  useEffect(() => {
    if (!isMechanic || !isTracking || !onMechanicLocationUpdate) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        onMechanicLocationUpdate(newLocation);
      },
      (error) => {
        console.error("Error tracking location:", error);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isMechanic, isTracking, onMechanicLocationUpdate]);

  if (loadError) {
    return (
      <Card className="p-4 text-destructive">
        Error loading map. Please try again later.
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  const bounds = new google.maps.LatLngBounds();
  bounds.extend(serviceRequest.location);
  if (mechanicLocation) {
    bounds.extend(mechanicLocation);
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="relative rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={serviceRequest.location}
          zoom={12}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: theme === 'dark' ? darkMapStyle : undefined,
          }}
          onLoad={(map) => map.fitBounds(bounds)}
        >
          {/* Client's location marker */}
          <Marker
            position={serviceRequest.location}
            icon={{
              url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 8v8'/%3E%3Cpath d='M8 12h8'/%3E%3C/svg%3E",
              scaledSize: new google.maps.Size(30, 30)
            }}
          />

          {/* Mechanic's location marker */}
          {mechanicLocation && (
            <Marker
              position={mechanicLocation}
              icon={{
                url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'/%3E%3C/svg%3E",
                scaledSize: new google.maps.Size(30, 30)
              }}
            />
          )}

          {/* Show route if available */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: theme === 'dark' ? '#60a5fa' : '#2563eb',
                  strokeWeight: 5
                }
              }}
            />
          )}
        </GoogleMap>
      </div>

      {isMechanic && (
        <Button 
          className="w-full"
          variant={isTracking ? "destructive" : "default"}
          onClick={() => setIsTracking(!isTracking)}
        >
          {isTracking ? (
            <>Stop Sharing Location</>
          ) : (
            <>Share My Location</>
          )}
        </Button>
      )}

      {eta && (
        <div className="flex items-center justify-between px-4 py-2 bg-secondary rounded-lg">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <span className="font-medium">Estimated arrival time:</span>
          </div>
          <span className="text-muted-foreground">{eta}</span>
        </div>
      )}
    </Card>
  );
}
