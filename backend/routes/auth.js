import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  getLockoutExpiry,
  getRemainingLockMinutes,
  isAccountLocked,
  MAX_FAILED_ATTEMPTS
} from '../config/loginSecurity.js';
import {
  clearIpAttempts,
  loginRateLimiter,
  registerFailedIpAttempt
} from '../middleware/loginRateLimiter.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password, role = 'vecino' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Complete todos los campos' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/login', loginRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (user && isAccountLocked(user.lockUntil)) {
      const retryAfterMinutes = getRemainingLockMinutes(user.lockUntil);

      return res.status(429).json({
        message: `Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta nuevamente en ${retryAfterMinutes} minuto(s).`,
        retryAfterMinutes,
        locked: true
      });
    }

    const isValidCredentials =
      user && (await bcrypt.compare(password, user.password));

    if (!isValidCredentials) {
      registerFailedIpAttempt(req);

      if (user) {
        user.failedLoginAttempts += 1;

        if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
          user.lockUntil = getLockoutExpiry();
          await user.save();

          return res.status(429).json({
            message: `Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta nuevamente en ${getRemainingLockMinutes(user.lockUntil)} minuto(s).`,
            retryAfterMinutes: getRemainingLockMinutes(user.lockUntil),
            locked: true
          });
        }

        await user.save();

        const attemptsRemaining = MAX_FAILED_ATTEMPTS - user.failedLoginAttempts;

        return res.status(401).json({
          message: `Credenciales inválidas. Te quedan ${attemptsRemaining} intento(s) antes del bloqueo temporal.`,
          attemptsRemaining
        });
      }

      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    clearIpAttempts(req);

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
