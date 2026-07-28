import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ChallanStatus, StockMovementType } from '@prisma/client';

/**
 * Helper to generate auto-incremented or formatted Challan Number (e.g. CHN-20260728-1001)
 */
const generateChallanNumber = async (): Promise<string> => {
  const count = await prisma.salesChallan.count();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sequence = String(count + 1).padStart(4, '0');
  return `CHN-${dateStr}-${sequence}`;
};

/**
 * POST /api/sales-challans
 * Create a new Sales Challan (as DRAFT or CONFIRMED).
 * Stores snapshot product data (name & unit price).
 * If status is CONFIRMED, stock is atomically deducted and OUT stock logs created.
 * Allowed Roles: ADMIN, SALES
 */
export const createSalesChallan = async (req: Request, res: Response) => {
  try {
    const { customerId, items, status = ChallanStatus.DRAFT } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: 'customerId is required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required and must contain at least one product.',
      });
    }

    if (!Object.values(ChallanStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${Object.values(ChallanStatus).join(', ')}`,
      });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    // Verify Customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Validate and fetch product snapshots for all items
    const preparedItems: Array<{
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
    }> = [];

    let totalQuantity = 0;

    for (const item of items) {
      const { productId, quantity } = item;
      const parsedQty = parseInt(quantity, 10);

      if (!productId || !parsedQty || parsedQty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have a valid productId and positive quantity.',
        });
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID '${productId}' not found.`,
        });
      }

      preparedItems.push({
        productId: product.id,
        productName: product.name, // Snapshot
        unitPrice: product.unitPrice, // Snapshot
        quantity: parsedQty,
      });

      totalQuantity += parsedQty;
    }

    const challanNumber = await generateChallanNumber();

    // Execute logic based on initial status
    if (status === ChallanStatus.CONFIRMED) {
      // Execute Atomic Database Transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Verify stock sufficiency for all items
        for (const item of preparedItems) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (!prod) {
            throw new Error(`PRODUCT_NOT_FOUND:${item.productName}`);
          }
          if (prod.currentStock < item.quantity) {
            throw new Error(
              `INSUFFICIENT_STOCK:${prod.name}|Available:${prod.currentStock}|Requested:${item.quantity}`
            );
          }
        }

        // 2. Reduce stock and create OUT stock movement logs
        for (const item of preparedItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: StockMovementType.OUT,
              reason: `Sales Challan Confirmation (${challanNumber})`,
              createdById: req.user!.id,
            },
          });
        }

        // 3. Create SalesChallan with items
        const newChallan = await tx.salesChallan.create({
          data: {
            challanNumber,
            customerId,
            totalQuantity,
            status: ChallanStatus.CONFIRMED,
            createdById: req.user!.id,
            items: {
              create: preparedItems,
            },
          },
          include: {
            customer: true,
            createdBy: { select: { id: true, name: true, role: true } },
            items: true,
          },
        });

        return newChallan;
      });

      return res.status(201).json({
        success: true,
        message: 'Sales Challan created and confirmed successfully. Inventory stock automatically reduced.',
        data: result,
      });
    } else {
      // Create Draft Sales Challan (No stock deduction)
      const draftChallan = await prisma.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          status: ChallanStatus.DRAFT,
          createdById: req.user.id,
          items: {
            create: preparedItems,
          },
        },
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true, role: true } },
          items: true,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Sales Challan draft created successfully.',
        data: draftChallan,
      });
    }
  } catch (error: any) {
    if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
      const parts = error.message.split('|');
      const prodName = parts[0].split(':')[1];
      const available = parts[1].split(':')[1];
      const requested = parts[2].split(':')[1];
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for product '${prodName}'. Available: ${available}, Requested: ${requested}. Stock cannot go negative.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create Sales Challan.',
      error: error.message,
    });
  }
};

/**
 * GET /api/sales-challans
 * Fetch list of sales challans with search, status filtering, and pagination.
 * Allowed Roles: ADMIN, SALES, WAREHOUSE, ACCOUNTS
 */
export const getSalesChallans = async (req: Request, res: Response) => {
  try {
    const { search, status, customerId, page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && Object.values(ChallanStatus).includes(status as ChallanStatus)) {
      where.status = status as ChallanStatus;
    }

    if (customerId) {
      where.customerId = customerId as string;
    }

    if (search) {
      const query = (search as string).trim();
      where.OR = [
        { challanNumber: { contains: query } },
        { customer: { name: { contains: query } } },
        { customer: { businessName: { contains: query } } },
      ];
    }

    const [total, challans] = await Promise.all([
      prisma.salesChallan.count({ where }),
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdDate: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, businessName: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
          items: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: challans,
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
      message: 'Failed to retrieve Sales Challans.',
      error: error.message,
    });
  }
};

/**
 * GET /api/sales-challans/:id
 * Retrieve single Sales Challan detail page with product snapshot items.
 * Allowed Roles: ADMIN, SALES, WAREHOUSE, ACCOUNTS
 */
export const getSalesChallanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        items: true,
      },
    });

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Sales Challan not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: challan,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Sales Challan details.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/sales-challans/:id/status
 * Update status of Sales Challan (DRAFT -> CONFIRMED, CONFIRMED -> CANCELLED, DRAFT -> CANCELLED).
 * Atomic transaction handles stock deduction on confirmation and stock restoration on cancellation.
 * Allowed Roles: ADMIN, SALES
 */
export const updateChallanStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(ChallanStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${Object.values(ChallanStatus).join(', ')}`,
      });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Sales Challan not found.' });
    }

    if (challan.status === status) {
      return res.status(400).json({
        success: false,
        message: `Sales Challan is already in status '${status}'.`,
      });
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of a cancelled Sales Challan.',
      });
    }

    const targetStatus = status as ChallanStatus;

    // Handle Transition: DRAFT -> CONFIRMED
    if (challan.status === ChallanStatus.DRAFT && targetStatus === ChallanStatus.CONFIRMED) {
      const updated = await prisma.$transaction(async (tx) => {
        // 1. Stock availability validation
        for (const item of challan.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) {
            throw new Error(`PRODUCT_NOT_FOUND:${item.productName}`);
          }
          if (product.currentStock < item.quantity) {
            throw new Error(
              `INSUFFICIENT_STOCK:${product.name}|Available:${product.currentStock}|Requested:${item.quantity}`
            );
          }
        }

        // 2. Stock deduction & StockLog entry
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: StockMovementType.OUT,
              reason: `Sales Challan Confirmation (${challan.challanNumber})`,
              createdById: req.user!.id,
            },
          });
        }

        // 3. Update Challan status
        return tx.salesChallan.update({
          where: { id },
          data: { status: ChallanStatus.CONFIRMED },
          include: { customer: true, items: true },
        });
      });

      return res.status(200).json({
        success: true,
        message: 'Sales Challan confirmed. Inventory stock automatically deducted.',
        data: updated,
      });
    }

    // Handle Transition: CONFIRMED -> CANCELLED
    if (challan.status === ChallanStatus.CONFIRMED && targetStatus === ChallanStatus.CANCELLED) {
      const updated = await prisma.$transaction(async (tx) => {
        // Revert stock & create IN stock log
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: StockMovementType.IN,
              reason: `Sales Challan Cancellation (${challan.challanNumber})`,
              createdById: req.user!.id,
            },
          });
        }

        return tx.salesChallan.update({
          where: { id },
          data: { status: ChallanStatus.CANCELLED },
          include: { customer: true, items: true },
        });
      });

      return res.status(200).json({
        success: true,
        message: 'Sales Challan cancelled. Reserved inventory stock restored.',
        data: updated,
      });
    }

    // Handle Transition: DRAFT -> CANCELLED
    if (challan.status === ChallanStatus.DRAFT && targetStatus === ChallanStatus.CANCELLED) {
      const updated = await prisma.salesChallan.update({
        where: { id },
        data: { status: ChallanStatus.CANCELLED },
        include: { customer: true, items: true },
      });

      return res.status(200).json({
        success: true,
        message: 'Draft Sales Challan cancelled.',
        data: updated,
      });
    }

    return res.status(400).json({
      success: false,
      message: `Invalid status transition from '${challan.status}' to '${status}'.`,
    });
  } catch (error: any) {
    if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
      const parts = error.message.split('|');
      const prodName = parts[0].split(':')[1];
      const available = parts[1].split(':')[1];
      const requested = parts[2].split(':')[1];
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for product '${prodName}'. Available: ${available}, Requested: ${requested}. Stock cannot go negative.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update Sales Challan status.',
      error: error.message,
    });
  }
};
