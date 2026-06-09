import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import transporter from '../config/mailer.js';

const router = express.Router();

const resetTokens = new Map();

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'El correo es obligatorio' });
    }

    try {
        const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
        return res.status(200).json({ message: 'Si el correo existe, recibirás las instrucciones en breve.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000;

    resetTokens.set(token, { userId: user._id, expiresAt });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: `"UrbanetPeru" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: 'Recuperación de contraseña - UrbanetPeru',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
            <h2>Recuperar contraseña</h2>
            <p>Hola <strong>${user.name}</strong>,</p>
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

    res.status(200).json({ message: 'Si el correo existe, recibirás las instrucciones en breve.' });
    } catch (error) {
        console.error('Error al enviar correo:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud' });
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