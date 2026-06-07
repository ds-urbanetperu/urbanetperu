import {
  APIProvider,
  Map,
  AdvancedMarker
} from "@vis.gl/react-google-maps";

export type GoogleMapPosition = {
  lat: number;
  lng: number;
};

type GoogleLocationMapProps = {
  position: GoogleMapPosition;
  onPositionChange: (position: GoogleMapPosition) => void;
};

const DEFAULT_ZOOM = 16;

function GoogleLocationMap({
  position,
  onPositionChange
}: GoogleLocationMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="google-map-fallback">
        No se encontró la API Key de Google Maps.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="google-map-container">
        <Map
          defaultCenter={position}
          center={position}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId="DEMO_MAP_ID"
          onClick={(event) => {
            if (!event.detail.latLng) {
              return;
            }

            onPositionChange({
              lat: event.detail.latLng.lat,
              lng: event.detail.latLng.lng
            });
          }}
        >
          <AdvancedMarker position={position} />
        </Map>
      </div>
    </APIProvider>
  );
}

export default GoogleLocationMap;