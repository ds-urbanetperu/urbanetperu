import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { assets } from "../config/assets";
import ImageSlot from "../components/common/ImageSlot";
import { apiRequest } from "../utils/api";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
    setError("");
  };

  const validatePassword = (password: string) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return hasUppercase && hasLowercase && hasNumber;
  };

  const handleSubmit = async () => {
    if (!token) {
      setError("El enlace de recuperación no es válido. Solicita uno nuevo.");
      return;
    }

    if (!form.password || !form.confirmPassword) {
      setError("Completa ambos campos.");
      return;
    }

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (!validatePassword(form.password)) {
      setError("La contraseña debe incluir mayúsculas, minúsculas y números.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: {
          token,
          password: form.password
        }
      });

      navigate("/reset-password/success");
    } catch (apiError) {
      const message =
        apiError instanceof Error
          ? apiError.message
          : "No se pudo actualizar la contraseña.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <ImageSlot
            src={assets.appLogo}
            alt="Logo UrbanetPeru"
            fallbackText="UP"
            className="auth-brand__logo"
          />
          <strong>
            Urbanet<span>Peru</span>
          </strong>
        </div>

        <div className="auth-title">
          <h1>Crear nueva contraseña</h1>
          <p>Ingresa una nueva contraseña segura para tu cuenta.</p>
        </div>

        <form className="auth-form">
          {!token && (
            <p className="auth-error">
              Este enlace no es válido. Solicita una nueva recuperación desde
              inicio de sesión.
            </p>
          )}

          <div className="form-group">
            <label>Nueva contraseña</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              disabled={loading || !token}
            />
          </div>

          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={loading || !token}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="button"
            className="auth-submit"
            onClick={handleSubmit}
            disabled={loading || !token}
          >
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>

          <button
            type="button"
            className="auth-secondary"
            onClick={() => navigate("/login")}
            disabled={loading}
          >
            Volver al inicio de sesión
          </button>
        </form>
      </section>
    </main>
  );
}

export default ResetPassword;
