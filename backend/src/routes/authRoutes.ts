import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { Role } from '../types/enums';

const router = Router();

// Public auth routes
router.post('/login', login);

// Protected auth routes
router.get('/me', authenticateJWT, getMe);

// Example test endpoint for role validation
router.get('/admin-only', authenticateJWT, authorizeRoles(Role.ADMIN), (req, res) => {
  res.json({ success: true, message: 'Welcome Admin! Access granted to admin protected area.' });
});

export default router;
