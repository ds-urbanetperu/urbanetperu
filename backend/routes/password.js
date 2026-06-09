import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { sendPasswordResetEmail } from '../config/mailer.js';

const router = express.Router();

const resetTokens = new Map();

function getClientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:3000';
}

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'El correo es obligatorio' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const genericMessage = 'Si el correo existe, recibirás las instrucciones en breve.';

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({ message: genericMessage });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000;

    resetTokens.set(token, { userId: user._id, expiresAt });

    const resetLink = `${getClientUrl()}/reset-password?token=${token}`;

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetLink
    });

    res.status(200).json({ message: genericMessage });
  } catch (error) {
    console.error('Error al procesar recuperación:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud de recuperación.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token y nueva contraseña son obligatorios' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const entry = resetTokens.get(token);

  if (!entry) {
    return res.status(400).json({ message: 'Token inválido o ya utilizado' });
  }

  if (Date.now() > entry.expiresAt) {
    resetTokens.delete(token);
    return res.status(400).json({ message: 'El enlace ha expirado. Solicita uno nuevo.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(entry.userId, {
      password: hashedPassword,
      failedLoginAttempts: 0,
      lockUntil: null
    });

    resetTokens.delete(token);

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    res.status(500).json({ message: 'Error al actualizar la contraseña' });
  }
});

export default router;
