import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageSlot from "../components/common/ImageSlot";
import { assets } from "../config/assets";
import { apiRequest } from "../utils/api";
import { saveSession, type SessionUser } from "../utils/authStorage";

type UserType = "vecino" | "municipal";

const MUNICIPAL_CREDENTIALS = {
  email: "municipal@urbanetperu.pe",
  password: "municipal123"
};

function Login() {
  const navigate = useNavigate();

  const [selectedUserType, setSelectedUserType] = useState<UserType>("vecino");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUserTypeChange = (userType: UserType) => {
    setSelectedUserType(userType);
    setError("");
  };

  const handleMunicipalLogin = () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail !== MUNICIPAL_CREDENTIALS.email ||
      password !== MUNICIPAL_CREDENTIALS.password
    ) {
      setError("Credenciales municipales inválidas.");
      return;
    }

    const municipalUser: SessionUser = {
      id: "municipal-demo",
      name: "Municipalidad",
      email: MUNICIPAL_CREDENTIALS.email,
      role: "municipal"
    };

    saveSession("municipal-demo-token", municipalUser);
    navigate("/municipal");
  };

  const handleCitizenLogin = async () => {
    const response = await apiRequest<{ user: SessionUser; token: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: { email, password }
      }
    );

    saveSession(response.token, response.user);

    if (response.user.role === "municipal") {
      navigate("/municipal");
      return;
    }

    navigate("/inicio");
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (selectedUserType === "municipal") {
        handleMunicipalLogin();
        return;
      }

      await handleCitizenLogin();
    } catch (apiError) {
      const message =
        apiError instanceof Error
          ? apiError.message
          : "No se pudo iniciar sesión.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section
        className="login-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(11,17,32,0.82), rgba(11,17,32,0.55)), url(${assets.heroImage})`
        }}
      >
        <div className="login-hero__content">
          <h1>UrbanetPeru</h1>
          <p>
            Conectando a los ciudadanos con su municipalidad para construir
            ciudades más inteligentes y seguras.
          </p>
        </div>
      </section>

      <section className="login-auth">
        <div className="login-card">
          <div className="login-brand">
            <ImageSlot
              src={assets.appLogo}
              alt="Logo UrbanetPeru"
              fallbackText="UP"
              className="login-brand__logo"
            />
            <strong>
              Urbanet<span>Peru</span>
            </strong>
          </div>

          <div className="login-title">
            <h2>Bienvenido</h2>
            <p>Plataforma inteligente de reporte ciudadano</p>
          </div>

          <form className="login-form" onSubmit={(event) => event.preventDefault()}>
            <div className="form-group">
              <label>Tipo de usuario</label>
              <div className="user-type-selector">
                <button
                  type="button"
                  className={selectedUserType === "vecino" ? "is-active" : ""}
                  onClick={() => handleUserTypeChange("vecino")}
                >
                  Vecino
                </button>
                <button
                  type="button"
                  className={selectedUserType === "municipal" ? "is-active" : ""}
                  onClick={() => handleUserTypeChange("municipal")}
                >
                  Municipal
                </button>
              </div>
            </div>

            {selectedUserType === "municipal" && (
              <div className="municipal-demo-box">
                <span>Acceso municipal de demostración</span>
                <p>
                  Correo: <strong>{MUNICIPAL_CREDENTIALS.email}</strong>
                </p>
                <p>
                  Contraseña: <strong>{MUNICIPAL_CREDENTIALS.password}</strong>
                </p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                placeholder={
                  selectedUserType === "municipal"
                    ? MUNICIPAL_CREDENTIALS.email
                    : "ejemplo@correo.com"
                }
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <button
              type="button"
              className="login-submit"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading
                ? "Ingresando..."
                : selectedUserType === "municipal"
                  ? "Ingresar como Municipal"
                  : "Ingresar al Sistema"}
            </button>

            {error && <p className="auth-error">{error}</p>}

            {selectedUserType === "vecino" && (
              <>
                <button
                  type="button"
                  className="login-link"
                  onClick={() => navigate("/forgot-password")}
                >
                  ¿Olvidaste tu contraseña?
                </button>

                <div className="login-divider">
                  <span></span>
                  <small>o</small>
                  <span></span>
                </div>

                <p className="register-text">
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/registro")}
                  >
                    Crea una nueva aquí
                  </button>
                </p>
              </>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;
