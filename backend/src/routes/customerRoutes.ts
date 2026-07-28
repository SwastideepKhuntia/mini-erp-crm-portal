import { Router } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  addFollowUpNote,
} from '../controllers/customerController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// All customer endpoints require a valid JWT token
router.use(authenticateJWT);

// GET /api/customers - List customers with search/filters (Accessible by ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get('/', authorizeRoles(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getCustomers);

// GET /api/customers/:id - View customer detail & follow-ups (Accessible by ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get('/:id', authorizeRoles(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getCustomerById);

// POST /api/customers - Add customer (Accessible by ADMIN, SALES)
router.post('/', authorizeRoles(Role.ADMIN, Role.SALES), createCustomer);

// PUT /api/customers/:id - Edit customer (Accessible by ADMIN, SALES)
router.put('/:id', authorizeRoles(Role.ADMIN, Role.SALES), updateCustomer);

// POST /api/customers/:id/follow-ups - Add follow-up note (Accessible by ADMIN, SALES)
router.post('/:id/follow-ups', authorizeRoles(Role.ADMIN, Role.SALES), addFollowUpNote);

export default router;
