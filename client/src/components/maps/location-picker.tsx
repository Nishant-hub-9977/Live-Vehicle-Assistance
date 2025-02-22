import { useState, useCallback, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { MapPin, Crosshair, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const containerStyle = {
  width: '100%',
  height: '300px'
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629  // Center of India
};

// Night mode style for the map
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

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(initialLocation || null);
  const [isLocating, setIsLocating] = useState(false);
  const { theme } = useTheme();

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!
  });

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const newLocation = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };

    setMarker(newLocation);
    onLocationSelect(newLocation);
  }, [onLocationSelect]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setMarker(newLocation);
        onLocationSelect(newLocation);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please select manually.");
        setIsLocating(false);
      }
    );
  }, [onLocationSelect]);

  if (loadError) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-muted text-destructive">
        Error loading map. Please try again later.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={marker || defaultCenter}
          zoom={marker ? 15 : 5}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: theme === 'dark' ? darkMapStyle : undefined,
            mapTypeId: 'roadmap'
          }}
        >
          {marker && (
            <Marker
              position={marker}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>
      </div>

      <div className="flex gap-4">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={getCurrentLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4 mr-2" />
          )}
          {isLocating ? "Getting Location..." : "Use My Location"}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            setMarker(null);
            onLocationSelect(defaultCenter);
          }}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Reset Location
        </Button>
      </div>
    </div>
  );
}