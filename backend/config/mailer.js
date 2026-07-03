import nodemailer from 'nodemailer';

export function isMailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_PASS);
}

export function getTransporter() {
  if (!isMailConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
}

function logResetLink(resetLink) {
  console.log('[UrbanetPeru] Enlace de recuperación de contraseña:');
  console.log(resetLink);
}

export async function sendPasswordResetEmail({ to, name, resetLink }) {
  if (!isMailConfigured()) {
    logResetLink(resetLink);
    return { sent: false, mode: 'console' };
  }

  const transporter = getTransporter();

  if (!transporter) {
    logResetLink(resetLink);
    return { sent: false, mode: 'console' };
  }

  try {
    await transporter.sendMail({
      from: `"UrbanetPeru" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Recuperación de contraseña - UrbanetPeru',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2>Recuperar contraseña</h2>
          <p>Hola <strong>${name}</strong>,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña en UrbanetPeru.</p>
          <p>Haz clic en el botón para crear una nueva contraseña. Este enlace expira en <strong>15 minutos</strong>.</p>
          <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
            Restablecer contraseña
          </a>
          <p>Si no solicitaste esto, ignora este correo.</p>
          <hr/>
          <small>UrbanetPeru — Plataforma de reportes ciudadanos</small>
        </div>
      `
    });

    return { sent: true, mode: 'email' };
  } catch (error) {
    console.error('Error al enviar correo:', error);
    logResetLink(resetLink);
    return { sent: false, mode: 'console-fallback' };
  }
}
