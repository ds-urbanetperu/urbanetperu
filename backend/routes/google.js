import express from 'express';
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

    let user = await User.findOne({ email });

    if (!user) {
        user = await User.create({
            name,
            email,
            password: `google_${googleId}`,
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