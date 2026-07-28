import { Router } from 'express';
import {
  createSalesChallan,
  getSalesChallans,
  getSalesChallanById,
  updateChallanStatus,
} from '../controllers/challanController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { Role } from '../types/enums';

const router = Router();

// Require JWT authentication for all sales challan endpoints
router.use(authenticateJWT);

// GET /api/sales-challans - List sales challans with search and status filtering (Accessible by ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get('/', authorizeRoles(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getSalesChallans);

// GET /api/sales-challans/:id - Sales challan detail with items & snapshots (Accessible by ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get('/:id', authorizeRoles(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getSalesChallanById);

// POST /api/sales-challans - Create new sales challan as Draft or Confirmed (Accessible by ADMIN, SALES)
router.post('/', authorizeRoles(Role.ADMIN, Role.SALES), createSalesChallan);

// PUT /api/sales-challans/:id/status - Update status (Draft, Confirmed, Cancelled) (Accessible by ADMIN, SALES)
router.put('/:id/status', authorizeRoles(Role.ADMIN, Role.SALES), updateChallanStatus);

export default router;
