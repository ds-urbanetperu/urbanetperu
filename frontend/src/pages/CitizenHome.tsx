import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../config/assets";
import ImageSlot from "../components/common/ImageSlot";
import { clearSession, getSessionUser } from "../utils/authStorage";

function CitizenHome() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const sessionUser = getSessionUser();
  const userName = sessionUser?.name || "Usuario";

  const showMessage = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <main className="citizen-page">
      <header className="citizen-header">
        <div className="citizen-header__brand">
          <ImageSlot
            src={assets.appLogo}
            alt="Logo UrbanetPeru"
            fallbackText="UP"
            className="citizen-header__logo"
          />

          <strong>
            Urbanet<span>Peru</span>
          </strong>
        </div>

        <div className="citizen-header__actions">
          <span className="citizen-user">{userName}</span>

          <button
            type="button"
            className="citizen-logout"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="citizen-content">
        <section className="citizen-hero">
          <div className="citizen-hero__text">
            <p className="citizen-eyebrow">Portal ciudadano</p>

            <h1>
              Hola, <span>{userName}</span>
            </h1>

            <p>
              Tu aporte geolocalizado ayuda a que las cuadrillas municipales
              actúen con mayor eficacia. ¿Qué problema deseas reportar hoy?
            </p>
          </div>
        </section>

        <section className="pothole-dashboard">
          <article className="pothole-action-card">
            <div className="pothole-action-card__content">
              <span className="pothole-action-card__eyebrow">Nuevo reporte</span>

              <h2>Registrar bache en la vía pública</h2>

              <p>
                Describe el problema, adjunta una imagen y selecciona la ubicación
                aproximada del bache para facilitar su identificación.
              </p>

              <div className="pothole-action-card__steps">
                <span>1. Describe el bache</span>
                <span>2. Adjunta una imagen</span>
                <span>3. Marca la ubicación</span>
              </div>
            </div>

            <div className="pothole-action-card__actions">
              <button
                type="button"
                className="pothole-primary-button"
                onClick={() => navigate("/reportar-baches")}
              >
                Iniciar reporte de bache
              </button>
            </div>
          </article>

          <article className="pothole-history-card">
            <div>
              <span className="pothole-history-card__eyebrow">Historial</span>

              <h2>Mis reportes registrados</h2>

              <p>
                Consulta los reportes enviados y revisa la información registrada
                anteriormente.
              </p>
            </div>

            <button
              type="button"
              className="pothole-secondary-button"
              onClick={() => navigate("/mis-reportes")}
            >
              Revisar historial
            </button>
          </article>
        </section>
      </section>

      {toast && (
        <div className="citizen-toast">
          {toast}
        </div>
      )}
    </main>
  );
}

export default CitizenHome;