import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, CustomerType, CustomerStatus, StockMovementType, ChallanStatus } from '../src/types/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // 1. Password Hashing
  const defaultPassword = await bcrypt.hash('password123', 10);

  // 2. Seed Users (All 4 Required Roles)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: { password: defaultPassword, role: Role.ADMIN, name: 'System Admin' },
    create: {
      name: 'System Admin',
      email: 'admin@company.com',
      password: defaultPassword,
      role: Role.ADMIN,
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@company.com' },
    update: { password: defaultPassword, role: Role.SALES, name: 'Sales Executive' },
    create: {
      name: 'Sales Executive',
      email: 'sales@company.com',
      password: defaultPassword,
      role: Role.SALES,
    },
  });

  const warehouseUser = await prisma.user.upsert({
    where: { email: 'warehouse@company.com' },
    update: { password: defaultPassword, role: Role.WAREHOUSE, name: 'Warehouse Manager' },
    create: {
      name: 'Warehouse Manager',
      email: 'warehouse@company.com',
      password: defaultPassword,
      role: Role.WAREHOUSE,
    },
  });

  const accountsUser = await prisma.user.upsert({
    where: { email: 'accounts@company.com' },
    update: { password: defaultPassword, role: Role.ACCOUNTS, name: 'Accounts Specialist' },
    create: {
      name: 'Accounts Specialist',
      email: 'accounts@company.com',
      password: defaultPassword,
      role: Role.ACCOUNTS,
    },
  });

  console.log('✅ Seeded 4 User Roles (Admin, Sales, Warehouse, Accounts)');

  // 3. Seed Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Rahul Sharma',
      mobileNumber: '+919876543210',
      email: 'rahul@techtraders.com',
      businessName: 'Tech Traders Pvt Ltd',
      gstNumber: '27AABCU9603R1ZN',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Plot 42, Industrial Area Phase II, Mumbai',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Key distributor for West Zone enterprise accounts.',
      followUps: {
        create: [
          {
            note: 'Initial client onboarding call completed. Rate card shared.',
            createdById: salesUser.id,
          },
          {
            note: 'Follow-up call: Client requested pricing discount for bulk order.',
            createdById: salesUser.id,
          },
        ],
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Ananya Verma',
      mobileNumber: '+919123456789',
      email: 'ananya@apexretail.in',
      businessName: 'Apex Retail Store',
      gstNumber: '07AABCU1234R1ZM',
      customerType: CustomerType.RETAIL,
      address: 'Shop 14, Main Market, Connaught Place, New Delhi',
      status: CustomerStatus.LEAD,
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Interested in retail display products.',
      followUps: {
        create: [
          {
            note: 'Prospect inquiry received via website form.',
            createdById: salesUser.id,
          },
        ],
      },
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Vikram Mehta',
      mobileNumber: '+919988776655',
      email: 'vikram@globalwholesalers.com',
      businessName: 'Global Wholesale Mart',
      gstNumber: '29AABCU5678R1ZL',
      customerType: CustomerType.WHOLESALE,
      address: 'Warehouse Complex B, Electronic City, Bengaluru',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: 'Monthly bulk hardware order partner.',
    },
  });

  console.log('✅ Seeded 3 Customers with Follow-up notes timeline');

  // 4. Seed Products
  const prod1 = await prisma.product.create({
    data: {
      name: 'Logitech MX Master 3S Wireless Mouse',
      sku: 'LOGI-MX3S-01',
      category: 'Peripherals',
      unitPrice: 99.99,
      currentStock: 50,
      minStockAlertQuantity: 10,
      locationWarehouse: 'Rack-A1, Central Warehouse',
      stockLogs: {
        create: [
          {
            quantityChanged: 50,
            movementType: StockMovementType.IN,
            reason: 'Initial Inventory Inward Order #PO-1001',
            createdById: warehouseUser.id,
          },
        ],
      },
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      name: 'Dell UltraSharp 27" 4K Monitor',
      sku: 'DELL-U2723QE',
      category: 'Displays',
      unitPrice: 549.50,
      currentStock: 15,
      minStockAlertQuantity: 5,
      locationWarehouse: 'Rack-B3, North Warehouse',
      stockLogs: {
        create: [
          {
            quantityChanged: 15,
            movementType: StockMovementType.IN,
            reason: 'Initial Batch Receipt #PO-1002',
            createdById: warehouseUser.id,
          },
        ],
      },
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      name: 'Keychron K2 Mechanical Keyboard',
      sku: 'KEYCH-K2-RGB',
      category: 'Peripherals',
      unitPrice: 89.00,
      currentStock: 3, // Low stock item for testing filter!
      minStockAlertQuantity: 10,
      locationWarehouse: 'Rack-A2, Central Warehouse',
      stockLogs: {
        create: [
          {
            quantityChanged: 10,
            movementType: StockMovementType.IN,
            reason: 'Initial Inward Shipment',
            createdById: warehouseUser.id,
          },
          {
            quantityChanged: 7,
            movementType: StockMovementType.OUT,
            reason: 'Manual Stock Audit Adjustment (Damaged Unit Disposal)',
            createdById: warehouseUser.id,
          },
        ],
      },
    },
  });

  console.log('✅ Seeded 3 Products (including Low Stock item for alert testing)');

  // 5. Seed Sales Challans
  const challan1 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CHN-20260728-0001',
      customerId: customer1.id,
      totalQuantity: 2,
      status: ChallanStatus.CONFIRMED,
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: prod1.id,
            productName: prod1.name, // Snapshot
            unitPrice: prod1.unitPrice, // Snapshot
            quantity: 2,
          },
        ],
      },
    },
  });

  const challan2 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CHN-20260728-0002',
      customerId: customer3.id,
      totalQuantity: 1,
      status: ChallanStatus.DRAFT,
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: prod2.id,
            productName: prod2.name, // Snapshot
            unitPrice: prod2.unitPrice, // Snapshot
            quantity: 1,
          },
        ],
      },
    },
  });

  console.log('✅ Seeded 2 Sales Challans (1 Confirmed, 1 Draft with snapshot data)');

  console.log('✨ Seed completed successfully with realistic ERP + CRM test dataset!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
