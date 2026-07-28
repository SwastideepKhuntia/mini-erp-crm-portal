import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { StockMovementType } from '../types/enums';

/**
 * POST /api/products
 * Create a new product entry in inventory.
 * Allowed Roles: ADMIN, WAREHOUSE
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      sku,
      category,
      unitPrice,
      currentStock,
      minStockAlertQuantity,
      locationWarehouse,
    } = req.body;

    // Field validation strictly per PDF requirements
    if (
      !name ||
      !sku ||
      !category ||
      unitPrice === undefined ||
      currentStock === undefined ||
      minStockAlertQuantity === undefined ||
      !locationWarehouse
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: name, sku, category, unitPrice, currentStock, minStockAlertQuantity, locationWarehouse.',
      });
    }

    if (unitPrice < 0 || currentStock < 0 || minStockAlertQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'unitPrice, currentStock, and minStockAlertQuantity must be non-negative numbers.',
      });
    }

    const existingSku = await prisma.product.findUnique({
      where: { sku: sku.trim() },
    });

    if (existingSku) {
      return res.status(409).json({
        success: false,
        message: `Product with SKU '${sku}' already exists.`,
      });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category: category.trim(),
        unitPrice: parseFloat(unitPrice),
        currentStock: parseInt(currentStock, 10),
        minStockAlertQuantity: parseInt(minStockAlertQuantity, 10),
        locationWarehouse: locationWarehouse.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create product.',
      error: error.message,
    });
  }
};

/**
 * GET /api/products
 * Fetch products list with pagination, search, category filter, and low-stock filter.
 * Allowed Roles: ADMIN, WAREHOUSE, SALES, ACCOUNTS
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, category, lowStockOnly, page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (category) {
      where.category = (category as string).trim();
    }

    if (search) {
      const query = (search as string).trim();
      where.OR = [
        { name: { contains: query } },
        { sku: { contains: query } },
        { category: { contains: query } },
        { locationWarehouse: { contains: query } },
      ];
    }

    let products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { stockLogs: true },
        },
      },
    });

    // Apply low stock filter if requested
    if (lowStockOnly === 'true' || lowStockOnly === '1') {
      products = products.filter((p) => p.currentStock <= p.minStockAlertQuantity);
    }

    const total = products.length;
    const paginatedProducts = products.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      data: paginatedProducts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve products.',
      error: error.message,
    });
  }
};

/**
 * GET /api/products/:id
 * Fetch single product details with complete stock movement log history.
 * Allowed Roles: ADMIN, WAREHOUSE, SALES, ACCOUNTS
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLogs: {
          orderBy: { timestamp: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product details.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/products/:id
 * Update product details.
 * Allowed Roles: ADMIN, WAREHOUSE
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      category,
      unitPrice,
      currentStock,
      minStockAlertQuantity,
      locationWarehouse,
    } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    if (sku && sku.trim().toUpperCase() !== existing.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku: sku.trim().toUpperCase() } });
      if (skuCheck) {
        return res.status(409).json({
          success: false,
          message: `Product with SKU '${sku}' already exists.`,
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(sku && { sku: sku.trim().toUpperCase() }),
        ...(category && { category: category.trim() }),
        ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
        ...(currentStock !== undefined && { currentStock: parseInt(currentStock, 10) }),
        ...(minStockAlertQuantity !== undefined && { minStockAlertQuantity: parseInt(minStockAlertQuantity, 10) }),
        ...(locationWarehouse && { locationWarehouse: locationWarehouse.trim() }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: updatedProduct,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update product.',
      error: error.message,
    });
  }
};

/**
 * POST /api/products/:id/stock
 * Manually log stock addition or deduction (IN / OUT).
 * Atomic transaction updates stock and creates StockLog record.
 * Allowed Roles: ADMIN, WAREHOUSE
 */
export const logStockMovement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantityChanged, movementType, reason } = req.body;

    if (!quantityChanged || quantityChanged <= 0) {
      return res.status(400).json({
        success: false,
        message: 'quantityChanged must be a positive integer.',
      });
    }

    if (!movementType || !Object.values(StockMovementType).includes(movementType)) {
      return res.status(400).json({
        success: false,
        message: `movementType must be either '${StockMovementType.IN}' or '${StockMovementType.OUT}'.`,
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reason for stock movement is required.',
      });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const qty = parseInt(quantityChanged, 10);

    // Execute atomic transaction for stock update + log creation
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });

      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      // Check stock non-negativity constraint
      if (movementType === StockMovementType.OUT && product.currentStock < qty) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      const newStock =
        movementType === StockMovementType.IN
          ? product.currentStock + qty
          : product.currentStock - qty;

      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentStock: newStock },
      });

      const stockLog = await tx.stockLog.create({
        data: {
          productId: id,
          quantityChanged: qty,
          movementType,
          reason: reason.trim(),
          createdById: req.user!.id,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return { updatedProduct, stockLog };
    });

    return res.status(200).json({
      success: true,
      message: `Stock updated successfully. New current stock: ${result.updatedProduct.currentStock}`,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (error.message === 'INSUFFICIENT_STOCK') {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available. Stock quantity cannot go negative.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to record stock movement.',
      error: error.message,
    });
  }
};
