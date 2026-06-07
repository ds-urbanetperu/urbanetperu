import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import ImageSlot from "../components/common/ImageSlot";
import GoogleLocationMap, {
  type GoogleMapPosition
} from "../components/common/GoogleLocationMap";
import { assets } from "../config/assets";
import {
  generateReportId,
  getRandomSeverity,
  setPendingReport,
  type PotholeReport,
  type ReportCoords
} from "../utils/reportStorage";
import { apiRequest } from "../utils/api";
import { getSessionUser, getToken } from "../utils/authStorage";

const DEFAULT_LOCATION: GoogleMapPosition = {
  lat: -12.046374,
  lng: -77.042793
};

type FormErrors = {
  image?: string;
  location?: string;
};

function ReportPothole() {
  const navigate = useNavigate();

  const [imagePreview, setImagePreview] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [mapPosition, setMapPosition] =
    useState<GoogleMapPosition>(DEFAULT_LOCATION);

  const [locationStatus, setLocationStatus] = useState("");
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validTypes = ["image/png", "image/jpeg", "image/jpg"];

    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: "Solo se permiten imágenes JPG o PNG."
      }));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(String(reader.result));

      setErrors((prev) => ({
        ...prev,
        image: undefined
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleMapPositionChange = (position: GoogleMapPosition) => {
    setMapPosition(position);
    setHasSelectedLocation(true);
    setLocationStatus("Ubicación seleccionada en el mapa.");

    setErrors((prev) => ({
      ...prev,
      location: undefined
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Tu navegador no permite obtener la ubicación.");
      return;
    }

    setLocationStatus("Obteniendo tu ubicación actual...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const realPosition: GoogleMapPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setMapPosition(realPosition);
        setHasSelectedLocation(true);
        setLocationStatus("Ubicación actual detectada correctamente.");

        setErrors((prev) => ({
          ...prev,
          location: undefined
        }));
      },
      () => {
        setLocationStatus(
          "No se pudo obtener la ubicación. Verifica los permisos del navegador."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newErrors: FormErrors = {};

    if (!imagePreview) {
      newErrors.image = "La foto del bache es obligatoria.";
    }

    if (!hasSelectedLocation) {
      newErrors.location =
        "Debes seleccionar la ubicación del bache o usar tu ubicación actual.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const token = getToken();
    const user = getSessionUser();

    if (!token || !user) {
      setErrors((prev) => ({
        ...prev,
        image:
          "Tu sesión expiró. Inicia sesión nuevamente para registrar el reporte."
      }));
      return;
    }

    const aiResult = getRandomSeverity();

    const coords: ReportCoords = {
      x: 0,
      y: 0,
      lat: mapPosition.lat,
      lng: mapPosition.lng
    };

    const locationText = `Lat: ${mapPosition.lat.toFixed(
      6
    )}, Lng: ${mapPosition.lng.toFixed(6)}`;

    const report: PotholeReport = {
      id: generateReportId(),
      type: "Bache",
      description,
      imageUrl: imagePreview,
      address: locationText,
      distrito: "Ubicación detectada",
      coords,
      severity: aiResult.severity,
      confidence: aiResult.confidence,
      status: "Recibido",
      createdAt: new Date().toISOString()
    };

    try {
      setSubmitting(true);

      await apiRequest("/api/reports", {
        method: "POST",
        token,
        body: {
          title: "Bache reportado por ciudadano",
          description: description || "Sin descripción",
          location: report.address,
          latitude: report.coords.lat,
          longitude: report.coords.lng,
          category: "bache",
          priority: aiResult.severity === "Crítico" ? "alta" : "media",
          images: [report.imageUrl],
          userName: user.name,
          userEmail: user.email
        }
      });

      setPendingReport(report);
      navigate("/procesando");
    } catch (apiError) {
      setErrors((prev) => ({
        ...prev,
        image:
          apiError instanceof Error
            ? apiError.message
            : "No se pudo registrar el reporte."
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="report-page">
      <header className="report-header">
        <div className="report-header__content">
          <button
            type="button"
            className="report-back"
            onClick={() => navigate("/inicio")}
          >
            ← Volver al menú principal
          </button>

          <div className="report-header__brand">
            <ImageSlot
              src={assets.appLogo}
              alt="UrbanetPeru"
              fallbackText="UP"
              className="report-header__logo"
            />

            <strong>
              Urbanet<span>Peru</span>
            </strong>
          </div>
        </div>
      </header>

      <section className="report-content">
        <div className="report-title">
          <p className="report-eyebrow">Reporte ciudadano</p>

          <h1>Reportar bache</h1>

          <p>
            Adjunta una foto clara del problema y selecciona su ubicación para
            que la municipalidad pueda evaluarlo.
          </p>
        </div>

        <form className="report-form" onSubmit={handleSubmit}>
          <section className="report-panel">
            <div className="report-panel__heading">
              <h2>Evidencia del problema</h2>
              <p>
                La imagen será usada para simular la clasificación automática.
              </p>
            </div>

            <label
              className={`photo-uploader ${
                errors.image ? "has-error" : ""
              }`}
            >
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleImageChange}
              />

              {imagePreview ? (
                <img src={imagePreview} alt="Vista previa del bache" />
              ) : (
                <div className="photo-uploader__empty">
                  <span>Subir foto</span>
                  <strong>Tomar foto o subir imagen</strong>
                  <small>Formatos permitidos: JPG, JPEG o PNG</small>
                </div>
              )}
            </label>

            {errors.image && <p className="report-error">{errors.image}</p>}

            <div className="form-group">
              <label htmlFor="description">Descripción opcional</label>

              <textarea
                id="description"
                maxLength={500}
                rows={5}
                placeholder="Ejemplo: El bache está frente a una zona escolar y dificulta el tránsito."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />

              <small className="character-counter">
                {description.length}/500 caracteres
              </small>
            </div>
          </section>

          <section className="report-panel">
            <div className="report-panel__heading">
              <h2>Ubicación del bache</h2>
              <p>
                Selecciona un punto en el mapa o usa tu ubicación actual.
              </p>
            </div>

            <button
              type="button"
              className="location-button"
              onClick={handleUseCurrentLocation}
            >
              Usar mi ubicación actual
            </button>

            <GoogleLocationMap
              position={mapPosition}
              onPositionChange={handleMapPositionChange}
            />

            {locationStatus && (
              <p className="location-status">{locationStatus}</p>
            )}

            {errors.location && (
              <p className="report-error">{errors.location}</p>
            )}

            {hasSelectedLocation && (
              <div className="detected-address">
                <span>Coordenadas detectadas</span>

                <strong>
                  Lat: {mapPosition.lat.toFixed(6)}, Lng:{" "}
                  {mapPosition.lng.toFixed(6)}
                </strong>
              </div>
            )}

            <button
              type="submit"
              className="report-submit"
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Enviar reporte"}
            </button>
          </section>
        </form>
      </section>
    </main>
  );
}

export default ReportPothole;