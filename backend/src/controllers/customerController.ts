import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { CustomerType, CustomerStatus } from '@prisma/client';

/**
 * POST /api/customers
 * Create a new customer record.
 * Allowed Roles: ADMIN, SALES
 */
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const {
      name,
      mobileNumber,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    // Strict field validation according to PDF requirements
    if (!name || !mobileNumber || !email || !businessName || !customerType || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, mobileNumber, email, businessName, customerType, address.',
      });
    }

    // Validate enum types
    if (!Object.values(CustomerType).includes(customerType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid customerType. Must be one of: ${Object.values(CustomerType).join(', ')}`,
      });
    }

    if (status && !Object.values(CustomerStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(CustomerStatus).join(', ')}`,
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim().toLowerCase(),
        businessName: businessName.trim(),
        gstNumber: gstNumber ? gstNumber.trim() : null,
        customerType: customerType as CustomerType,
        address: address.trim(),
        status: (status as CustomerStatus) || CustomerStatus.LEAD,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes ? notes.trim() : null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: customer,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create customer.',
      error: error.message,
    });
  }
};

/**
 * GET /api/customers
 * List customers with pagination, search, and status/customerType filters.
 * Allowed Roles: ADMIN, SALES, WAREHOUSE, ACCOUNTS
 */
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { search, status, customerType, page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter criteria
    const where: any = {};

    if (status && Object.values(CustomerStatus).includes(status as CustomerStatus)) {
      where.status = status as CustomerStatus;
    }

    if (customerType && Object.values(CustomerType).includes(customerType as CustomerType)) {
      where.customerType = customerType as CustomerType;
    }

    if (search) {
      const query = (search as string).trim();
      where.OR = [
        { name: { contains: query } },
        { businessName: { contains: query } },
        { email: { contains: query } },
        { mobileNumber: { contains: query } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { followUps: true },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: customers,
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
      message: 'Failed to retrieve customers.',
      error: error.message,
    });
  }
};

/**
 * GET /api/customers/:id
 * Retrieve customer detail including complete follow-up notes history.
 * Allowed Roles: ADMIN, SALES, WAREHOUSE, ACCOUNTS
 */
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer detail.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/customers/:id
 * Edit/Update customer information.
 * Allowed Roles: ADMIN, SALES
 */
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      mobileNumber,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(mobileNumber && { mobileNumber: mobileNumber.trim() }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(businessName && { businessName: businessName.trim() }),
        ...(gstNumber !== undefined && { gstNumber: gstNumber ? gstNumber.trim() : null }),
        ...(customerType && { customerType: customerType as CustomerType }),
        ...(address && { address: address.trim() }),
        ...(status && { status: status as CustomerStatus }),
        ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
        ...(notes !== undefined && { notes: notes ? notes.trim() : null }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update customer.',
      error: error.message,
    });
  }
};

/**
 * POST /api/customers/:id/follow-ups
 * Add a follow-up note to a specific customer.
 * Allowed Roles: ADMIN, SALES
 */
export const addFollowUpNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note, followUpDate } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Follow-up note content is required.',
      });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    // Create follow-up note record and update customer's followUpDate if provided
    const [followUp] = await prisma.$transaction([
      prisma.customerFollowUp.create({
        data: {
          customerId: id,
          note: note.trim(),
          createdById: req.user.id,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      ...(followUpDate
        ? [
            prisma.customer.update({
              where: { id },
              data: { followUpDate: new Date(followUpDate) },
            }),
          ]
        : []),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Follow-up note added successfully.',
      data: followUp,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add follow-up note.',
      error: error.message,
    });
  }
};
