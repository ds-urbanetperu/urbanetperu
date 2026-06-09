import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Token de Google no proporcionado' });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ message: 'Google Sign-In no está configurado en el servidor' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    if (!email || !name) {
      return res.status(400).json({ message: 'No se pudo obtener información del perfil de Google' });
    }

    let user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      const hashedPassword = await bcrypt.hash(`google_${googleId}`, 10);

      user = await User.create({
        name,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'vecino'
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error en autenticación con Google:', error);
    res.status(401).json({ message: 'Token de Google inválido o expirado' });
  }
});

export default router;
