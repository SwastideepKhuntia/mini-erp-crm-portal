import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  logStockMovement,
} from '../controllers/productController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { Role } from '../types/enums';

const router = Router();

// All product endpoints require valid JWT authentication
router.use(authenticateJWT);

// GET /api/products - List products (Accessible by ADMIN, WAREHOUSE, SALES, ACCOUNTS)
router.get('/', authorizeRoles(Role.ADMIN, Role.WAREHOUSE, Role.SALES, Role.ACCOUNTS), getProducts);

// GET /api/products/:id - Product detail with stock logs (Accessible by ADMIN, WAREHOUSE, SALES, ACCOUNTS)
router.get('/:id', authorizeRoles(Role.ADMIN, Role.WAREHOUSE, Role.SALES, Role.ACCOUNTS), getProductById);

// POST /api/products - Add product (Accessible by ADMIN, WAREHOUSE)
router.post('/', authorizeRoles(Role.ADMIN, Role.WAREHOUSE), createProduct);

// PUT /api/products/:id - Edit product (Accessible by ADMIN, WAREHOUSE)
router.put('/:id', authorizeRoles(Role.ADMIN, Role.WAREHOUSE), updateProduct);

// POST /api/products/:id/stock - Log manual stock movement IN/OUT (Accessible by ADMIN, WAREHOUSE)
router.post('/:id/stock', authorizeRoles(Role.ADMIN, Role.WAREHOUSE), logStockMovement);

export default router;
