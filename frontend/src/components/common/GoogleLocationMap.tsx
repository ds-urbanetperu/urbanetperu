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
  onPositionChange?: (position: GoogleMapPosition) => void;
  readonly?: boolean;
  height?: string;
};

const DEFAULT_ZOOM = 16;

function GoogleLocationMap({
  position,
  onPositionChange,
  readonly = false,
  height = "320px"
}: GoogleLocationMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="google-map-fallback" style={{ minHeight: height }}>
        No se encontró la API Key de Google Maps.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="google-map-container" style={{ height }}>
        <Map
          defaultCenter={position}
          center={position}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling={readonly ? "none" : "greedy"}
          disableDefaultUI={readonly}
          mapId="DEMO_MAP_ID"
          onClick={(event) => {
            if (readonly || !onPositionChange || !event.detail.latLng) {
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