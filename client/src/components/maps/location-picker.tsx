import { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { MapPin, Crosshair } from "lucide-react";

const containerStyle = {
  width: '100%',
  height: '300px'
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629  // Center of India
};

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
}

export function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null);
  
  const { isLoaded } = useJsApiLoader({
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setMarker(newLocation);
        onLocationSelect(newLocation);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please select manually.");
      }
    );
  }, [onLocationSelect]);

  if (!isLoaded) {
    return <div className="h-[300px] flex items-center justify-center bg-muted">Loading map...</div>;
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
            fullscreenControl: false
          }}
        >
          {marker && <Marker position={marker} />}
        </GoogleMap>
      </div>
      
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={getCurrentLocation}
        >
          <Crosshair className="w-4 h-4 mr-2" />
          Use My Location
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            setMarker(null);
            onLocationSelect(defaultCenter);
          }}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Reset Location
        </Button>
      </div>
    </div>
  );
}
