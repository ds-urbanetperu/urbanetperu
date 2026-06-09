import { useEffect, useRef } from "react";
import { getGoogleClientId, loadGoogleScript } from "../../utils/googleAuth";

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void;
  disabled?: boolean;
};

function GoogleSignInButton({
  onCredential,
  disabled = false
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = getGoogleClientId();

    if (!clientId || disabled || !containerRef.current) {
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) {
          return;
        }

        containerRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              onCredential(response.credential);
            }
          }
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: containerRef.current.offsetWidth || 360,
          locale: "es"
        });
      })
      .catch(() => {
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
      });

    return () => {
      cancelled = true;
    };
  }, [disabled, onCredential]);

  if (!getGoogleClientId()) {
    return (
      <p className="auth-error">
        Configura VITE_GOOGLE_CLIENT_ID para habilitar el registro con Google.
      </p>
    );
  }

  return <div ref={containerRef} className="google-signin-wrapper" />;
}

export default GoogleSignInButton;
