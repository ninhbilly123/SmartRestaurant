import express from 'express';
import { login, createUser, getAllUsers, updateUser, toggleUserStatus } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/create-user', verifyToken, authorizeRoles('admin', 'super_admin'), createUser);
router.get('/users', verifyToken, authorizeRoles('admin', 'super_admin'), getAllUsers);
router.put('/users/:id', verifyToken, authorizeRoles('admin', 'super_admin'), updateUser);
router.patch('/users/:id/status', verifyToken, authorizeRoles('admin', 'super_admin'), toggleUserStatus);

export default router;
