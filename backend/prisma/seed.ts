import {
  PrismaClient,
  UserRole,
  Gender,
  WardType,
  ConsultationType,
  PrescriptionStatus,
  TransactionType,
  BloodType,
  Genotype,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function generateTempPassword(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUniqueUsername(firstName: string, lastName: string): string {
  const baseUsername =
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(
      /[^a-z0-9.]/g,
      '',
    );

  // For seeding, we'll use a simple approach with timestamp to ensure uniqueness
  const timestamp = Date.now().toString().slice(-6);
  return `${baseUsername}_${timestamp}`;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if --reset flag is provided
  const shouldReset = process.argv.includes('--reset');

  if (shouldReset) {
    console.log('🔄 Reset mode detected - clearing existing data...');
    // Clear existing data
    await clearDatabase();
  } else {
    console.log(
      '📝 Normal seeding mode - checking if database is already seeded...',
    );

    // Check if database is already seeded by looking for key data
    const existingUsers = await prisma.user.count();
    const existingPatients = await prisma.patient.count();
    const existingServices = await prisma.service.count();

    if (existingUsers > 0 && existingPatients > 0 && existingServices > 0) {
      console.log('✅ Database appears to be already seeded with data');
      console.log(`   - Users: ${existingUsers}`);
      console.log(`   - Patients: ${existingPatients}`);
      console.log(`   - Services: ${existingServices}`);
      console.log('💡 Use "yarn seed:reset" to clear and reseed the database');
      return;
    }

    console.log('📝 Database not fully seeded, proceeding with seeding...');
  }

  // Seed data in order of dependencies
  await seedUsers();
  await seedStaffMembers();
  await seedPatients();
  await seedPatientAccounts();
  await seedServiceCategories();
  await seedServices();
  await seedWards();
  await seedBeds();
  await seedAdmissions();
  await seedDailyCharges();
  await seedConsultations();
  await seedLabOrders();
  await seedLabTests();
  await seedMedications();
  await seedMedicationInventory();
  await seedPrescriptions();
  await seedPrescriptionMedications();
  await seedDispensedMedications();
  await seedSurgeries();
  await seedSurgicalProcedures();
  await seedOperatingRoomBookings();
  await seedInvoices();
  await seedCharges();
  await seedPayments();
  await seedRefunds();
  await seedCashTransactions();
  await seedPettyCash();
  await seedCashRequests();
  await seedPaystackCustomers();
  await seedPaystackInvoices();
  await seedAuditLogs();
  await seedAppointmentSlots();
  await seedAppointments();
  await seedNotificationTemplates();
  await seedNotifications();
  await seedProviderSchedules();
  await seedProviderTimeOff();
  await seedResources();
  await seedResourceSchedules();
  await seedPatientPreferences();
  await seedWaitlistEntries();

  console.log('✅ Database seeding completed successfully!');
}

// ===== PHARMACY SEEDING FUNCTIONS =====

async function seedMedications() {
  console.log('💊 Seeding medications...');

  const timestamp = Date.now().toString().slice(-6);
  const medications = [
    {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      strength: '500mg',
      form: 'Tablet',
      manufacturer: 'ABC Pharmaceuticals',
      drugCode: `PARA500-${timestamp}`,
      category: 'Painkiller',
      controlledDrug: false,
      requiresPrescription: false,
    },
    {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      strength: '250mg',
      form: 'Capsule',
      manufacturer: 'XYZ Pharma',
      drugCode: `AMOX250-${timestamp}`,
      category: 'Antibiotic',
      controlledDrug: false,
      requiresPrescription: true,
    },
    {
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      strength: '400mg',
      form: 'Tablet',
      manufacturer: 'MedCorp',
      drugCode: `IBUP400-${timestamp}`,
      category: 'Painkiller',
      controlledDrug: false,
      requiresPrescription: false,
    },
    {
      name: 'Omeprazole',
      genericName: 'Omeprazole',
      strength: '20mg',
      form: 'Capsule',
      manufacturer: 'HealthPharm',
      drugCode: `OMEP20-${timestamp}`,
      category: 'Antacid',
      controlledDrug: false,
      requiresPrescription: true,
    },
    {
      name: 'Morphine',
      genericName: 'Morphine Sulfate',
      strength: '10mg',
      form: 'Injection',
      manufacturer: 'Controlled Meds Inc',
      drugCode: `MORP10-${timestamp}`,
      category: 'Opioid',
      controlledDrug: true,
      requiresPrescription: true,
    },
    {
      name: 'Diazepam',
      genericName: 'Diazepam',
      strength: '5mg',
      form: 'Tablet',
      manufacturer: 'Anxiety Meds Ltd',
      drugCode: `DIAZ5-${timestamp}`,
      category: 'Benzodiazepine',
      controlledDrug: true,
      requiresPrescription: true,
    },
  ];

  for (const medicationData of medications) {
    await prisma.medication.create({
      data: medicationData,
    });
  }

  console.log(`✅ Created ${medications.length} medications`);
}

async function seedMedicationInventory() {
  console.log('📦 Seeding medication inventory...');

  const medications = await prisma.medication.findMany();

  for (const medication of medications) {
    // Create multiple inventory items for each medication
    const inventoryItems = [
      {
        batchNumber: `BATCH-${medication.drugCode}-001`,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        quantity: 1000,
        unitCost: 0.25,
        sellingPrice: 0.5,
        supplier: 'Primary Medical Supplies',
        purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
      {
        batchNumber: `BATCH-${medication.drugCode}-002`,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
        quantity: 500,
        unitCost: 0.3,
        sellingPrice: 0.6,
        supplier: 'Secondary Medical Supplies',
        purchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
    ];

    for (const inventoryData of inventoryItems) {
      await prisma.medicationInventory.create({
        data: {
          ...inventoryData,
          medicationId: medication.id,
          availableQuantity: inventoryData.quantity,
        },
      });
    }
  }

  console.log('✅ Created medication inventory items');
}

// ===== PATIENT ACCOUNTS SEEDING =====

async function seedPatientAccounts() {
  console.log('💰 Seeding patient accounts...');

  const patients = await prisma.patient.findMany();
  const existingUsers = await prisma.user.findMany({
    where: { role: 'PATIENT' },
  });

  if (patients.length === 0) {
    console.log('⚠️ Skipping patient accounts - no patients found');
    return;
  }

  // Check if patient accounts already exist
  const existingAccounts = await prisma.patientAccount.findMany();
  if (existingAccounts.length > 0) {
    console.log(
      `⚠️  Patient accounts already exist (${existingAccounts.length}), skipping account creation`,
    );
    return;
  }

  for (const patient of patients) {
    // Check if user already exists for this patient
    const existingUser = existingUsers.find(
      (user) =>
        user.email ===
        `${patient.firstName.toLowerCase()}.${patient.lastName.toLowerCase()}@example.com`,
    );

    if (existingUser) {
      console.log(
        `⚠️  User already exists for patient ${patient.patientId}, skipping user creation`,
      );
      continue;
    }

    const tempPassword = generateTempPassword();
    const user = await prisma.user.create({
      data: {
        email: `${patient.firstName.toLowerCase()}.${patient.lastName.toLowerCase()}@example.com`,
        username: patient.patientId.toLowerCase(),
        password: tempPassword,
        firstName: patient.firstName,
        lastName: patient.lastName,
        role: 'PATIENT',
      },
    });

    await prisma.patientAccount.create({
      data: {
        patientId: patient.id,
        accountNumber: `ACC${patient.patientId}`,
        balance: 0,
      },
    });

    console.log(
      `👤 Created user account for patient ${patient.patientId} with temporary password: ${tempPassword}`,
    );
  }

  const accounts = await prisma.patientAccount.findMany();
  console.log(`✅ Created ${accounts.length} patient accounts`);
  return accounts;
}

// ===== DAILY CHARGES SEEDING =====

async function seedDailyCharges() {
  console.log('📅 Seeding daily charges...');

  const admissions = await prisma.admission.findMany({
    where: { status: 'ADMITTED' },
  });

  for (const admission of admissions) {
    // Create daily charges for the last 7 days
    for (let i = 0; i < 7; i++) {
      const chargeDate = new Date();
      chargeDate.setDate(chargeDate.getDate() - i);

      // Get a random service for daily charges
      const services = await prisma.service.findMany();
      const randomService =
        services[Math.floor(Math.random() * services.length)];

      await prisma.dailyCharge.create({
        data: {
          admissionId: admission.id,
          serviceId: randomService.id,
          chargeDate,
          description: `Daily ward charges for ${chargeDate.toDateString()}`,
          amount: Math.random() * 200 + 100, // Random amount between 100-300
        },
      });
    }
  }

  console.log('✅ Created daily charges for admissions');
}

// ===== LAB TESTS SEEDING =====

async function seedLabTests() {
  console.log('🧪 Seeding lab tests...');

  const labOrders = await prisma.labOrder.findMany();
  const services = await prisma.service.findMany({
    where: { category: { name: 'Laboratory' } },
  });

  for (const order of labOrders) {
    // Create 2-4 tests per order
    const numTests = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < numTests; i++) {
      const service = services[Math.floor(Math.random() * services.length)];
      const unitPrice = Math.random() * 50 + 25; // Random price between 25-75
      const totalPrice = unitPrice;

      await prisma.labTest.create({
        data: {
          orderId: order.id,
          serviceId: service.id,
          unitPrice,
          totalPrice,
          status: Math.random() > 0.3 ? 'COMPLETED' : 'PENDING', // 70% completed
          result:
            Math.random() > 0.3 ? `Test result for ${service.name}` : null,
          notes: Math.random() > 0.5 ? 'Sample collected and processed' : null,
        },
      });
    }
  }

  console.log('✅ Created lab tests for orders');
}

// ===== PRESCRIPTION MEDICATIONS SEEDING =====

async function seedPrescriptionMedications() {
  console.log('💊 Seeding prescription medications...');

  const prescriptions = await prisma.prescription.findMany();
  const medications = await prisma.medication.findMany();

  for (const prescription of prescriptions) {
    // Create 1-3 medications per prescription
    const numMedications = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numMedications; i++) {
      const medication =
        medications[Math.floor(Math.random() * medications.length)];
      const quantity = Math.floor(Math.random() * 30) + 10; // Random quantity 10-40
      const unitPrice = Math.random() * 5 + 1; // Random price 1-6
      const totalPrice = unitPrice * quantity;

      await prisma.prescriptionMedication.create({
        data: {
          prescriptionId: prescription.id,
          medicationId: medication.id,
          dosage: `${Math.floor(Math.random() * 3) + 1} tablet(s)`,
          frequency: ['Once daily', 'Twice daily', 'Three times daily'][
            Math.floor(Math.random() * 3)
          ],
          duration: `${Math.floor(Math.random() * 7) + 3} days`,
          quantity,
          unitPrice,
          totalPrice,
          instructions: 'Take with food',
          isPaid: Math.random() > 0.4, // 60% paid
        },
      });
    }
  }

  console.log('✅ Created prescription medications');
}

// ===== SURGICAL PROCEDURES SEEDING =====

async function seedSurgicalProcedures() {
  console.log('🔪 Seeding surgical procedures...');

  const surgeries = await prisma.surgery.findMany();

  for (const surgery of surgeries) {
    // Create 1-3 procedures per surgery
    const numProcedures = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numProcedures; i++) {
      const procedureNames = [
        'Incision and drainage',
        'Suturing',
        'Biopsy',
        'Excision',
        'Repair',
        'Reconstruction',
      ];

      await prisma.surgicalProcedure.create({
        data: {
          surgeryId: surgery.id,
          procedureName:
            procedureNames[Math.floor(Math.random() * procedureNames.length)],
          description: 'Standard surgical procedure',
          cost: Math.random() * 500 + 200, // Random cost 200-700
        },
      });
    }
  }

  console.log('✅ Created surgical procedures');
}

// ===== OPERATING ROOM BOOKINGS SEEDING =====

async function seedOperatingRoomBookings() {
  console.log('🏥 Seeding operating room bookings...');

  const surgeries = await prisma.surgery.findMany({
    where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
  });

  for (const surgery of surgeries) {
    const roomNumbers = ['OR-1', 'OR-2', 'OR-3', 'OR-4'];
    const roomNumber =
      roomNumbers[Math.floor(Math.random() * roomNumbers.length)];

    const startTime = new Date(surgery.surgeryDate);
    startTime.setHours(9, 0, 0, 0); // 9 AM

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + Math.floor(Math.random() * 4) + 2); // 2-6 hours

    await prisma.operatingRoomBooking.create({
      data: {
        surgeryId: surgery.id,
        roomNumber,
        bookingDate: surgery.surgeryDate,
        startTime,
        endTime,
        status: 'CONFIRMED',
        notes: 'Operating room confirmed for surgery',
      },
    });
  }

  console.log('✅ Created operating room bookings');
}

// ===== REFUNDS SEEDING =====

async function seedRefunds() {
  console.log('💰 Seeding refunds...');

  const payments = await prisma.payment.findMany({
    where: { status: 'COMPLETED' },
  });

  // Create refunds for 10% of completed payments
  const refundCount = Math.floor(payments.length * 0.1);

  for (let i = 0; i < refundCount; i++) {
    const payment = payments[i];
    const refundAmount = Math.random() * Number(payment.amount) * 0.5; // Up to 50% refund

    await prisma.refund.create({
      data: {
        paymentId: payment.id,
        patientId: payment.patientId,
        invoiceId: payment.invoiceId,
        amount: refundAmount,
        reason: ['Patient request', 'Service not provided', 'Overpayment'][
          Math.floor(Math.random() * 3)
        ],
        status: Math.random() > 0.3 ? 'APPROVED' : 'PENDING',
        notes: 'Refund processed',
      },
    });
  }

  console.log(`✅ Created ${refundCount} refunds`);
}

// ===== AUDIT LOGS SEEDING =====

async function seedAuditLogs() {
  console.log('📝 Seeding audit logs...');

  const users = await prisma.user.findMany();
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];
  const modules = [
    'User',
    'Patient',
    'Billing',
    'Pharmacy',
    'Laboratory',
    'Surgery',
  ];

  // Create audit logs for the last 30 days
  for (let i = 0; i < 30; i++) {
    const logDate = new Date();
    logDate.setDate(logDate.getDate() - i);

    const numLogs = Math.floor(Math.random() * 20) + 10; // 10-30 logs per day

    for (let j = 0; j < numLogs; j++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const module = modules[Math.floor(Math.random() * modules.length)];

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action,
          tableName: module,
          recordId: `record-${Math.random().toString(36).substr(2, 9)}`,
          ipAddress: '192.168.1.100',
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
    }
  }

  console.log('✅ Created audit logs');
}

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');

  // Delete new appointment and notification related models first (due to foreign key constraints)
  try {
    await prisma.waitlistEntry.deleteMany();
    console.log('✅ Deleted waitlist entries');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table waitlist_entries doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during waitlist entries deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.patientPreference.deleteMany();
    console.log('✅ Deleted patient preferences');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table patient_preferences doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during patient preferences deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.resourceSchedule.deleteMany();
    console.log('✅ Deleted resource schedules');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table resource_schedules doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during resource schedules deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.resource.deleteMany();
    console.log('✅ Deleted resources');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table resources doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during resources deletion: ${error.message}`);
    }
  }

  try {
    await prisma.providerTimeOff.deleteMany();
    console.log('✅ Deleted provider time off');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table provider_time_off doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during provider time off deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.providerSchedule.deleteMany();
    console.log('✅ Deleted provider schedules');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table provider_schedules doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during provider schedules deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.notification.deleteMany();
    console.log('✅ Deleted notifications');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table notifications doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during notifications deletion: ${error.message}`);
    }
  }

  try {
    await prisma.notificationTemplate.deleteMany();
    console.log('✅ Deleted notification templates');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table notification_templates doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during notification templates deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.appointment.deleteMany();
    console.log('✅ Deleted appointments');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table appointments doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during appointments deletion: ${error.message}`);
    }
  }

  try {
    await prisma.appointmentSlot.deleteMany();
    console.log('✅ Deleted appointment slots');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table appointment_slots doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during appointment slots deletion: ${error.message}`,
      );
    }
  }

  // Continue with existing deletion order...
  try {
    await prisma.refund.deleteMany();
    console.log('✅ Deleted refunds');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table refunds doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during refunds deletion: ${error.message}`);
    }
  }

  try {
    await prisma.payment.deleteMany();
    console.log('✅ Deleted payments');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Error during payments deletion: ${error.message}`);
    }
  }

  try {
    await prisma.paystackInvoice.deleteMany();
    console.log('✅ Deleted Paystack invoices');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table paystack_invoices doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during Paystack invoices deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.paystackCustomer.deleteMany();
    console.log('✅ Deleted Paystack customers');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table paystack_customers doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during Paystack customers deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.cashRequest.deleteMany();
    console.log('✅ Deleted cash requests');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table cash_requests doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during cash requests deletion: ${error.message}`);
    }
  }

  try {
    await prisma.pettyCash.deleteMany();
    console.log('✅ Deleted petty cash');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table petty_cash doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during petty cash deletion: ${error.message}`);
    }
  }

  try {
    await prisma.cashTransaction.deleteMany();
    console.log('✅ Deleted cash transactions');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table cash_transactions doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during cash transactions deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.charge.deleteMany();
    console.log('✅ Deleted charges');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table charges doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during charges deletion: ${error.message}`);
    }
  }

  try {
    await prisma.invoice.deleteMany();
    console.log('✅ Deleted invoices');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table invoices doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during invoices deletion: ${error.message}`);
    }
  }

  try {
    await prisma.operatingRoomBooking.deleteMany();
    console.log('✅ Deleted operating room bookings');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table operating_room_bookings doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during operating room bookings deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.surgicalProcedure.deleteMany();
    console.log('✅ Deleted surgical procedures');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table surgical_procedures doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during surgical procedures deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.surgery.deleteMany();
    console.log('✅ Deleted surgeries');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table surgeries doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during surgeries deletion: ${error.message}`);
    }
  }

  try {
    await prisma.dispensedMedication.deleteMany();
    console.log('✅ Deleted dispensed medications');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table dispensed_medications doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during dispensed medications deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.prescriptionMedication.deleteMany();
    console.log('✅ Deleted prescription medications');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table prescription_medications doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during prescription medications deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.prescription.deleteMany();
    console.log('✅ Deleted prescriptions');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table prescriptions doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during prescriptions deletion: ${error.message}`);
    }
  }

  try {
    await prisma.medicationInventory.deleteMany();
    console.log('✅ Deleted medication inventory');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table medication_inventory doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during medication inventory deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.medication.deleteMany();
    console.log('✅ Deleted medications');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table medications doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during medications deletion: ${error.message}`);
    }
  }

  try {
    await prisma.labTest.deleteMany();
    console.log('✅ Deleted lab tests');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table lab_tests doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during lab tests deletion: ${error.message}`);
    }
  }

  try {
    await prisma.labOrder.deleteMany();
    console.log('✅ Deleted lab orders');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table lab_orders doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during lab orders deletion: ${error.message}`);
    }
  }

  try {
    await prisma.consultation.deleteMany();
    console.log('✅ Deleted consultations');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Error during consultations deletion: ${error.message}`);
    }
  }

  try {
    await prisma.dailyCharge.deleteMany();
    console.log('✅ Deleted daily charges');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table daily_charges doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during daily charges deletion: ${error.message}`);
    }
  }

  try {
    await prisma.admission.deleteMany();
    console.log('✅ Deleted admissions');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table admissions doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during admissions deletion: ${error.message}`);
    }
  }

  try {
    await prisma.bed.deleteMany();
    console.log('✅ Deleted beds');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table beds doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during beds deletion: ${error.message}`);
    }
  }

  try {
    await prisma.ward.deleteMany();
    console.log('✅ Deleted wards');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Error during wards deletion: ${error.message}`);
    }
  }

  try {
    await prisma.service.deleteMany();
    console.log('✅ Deleted services');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Error during services deletion: ${error.message}`);
    }
  }

  try {
    await prisma.serviceCategory.deleteMany();
    console.log('✅ Deleted service categories');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Error during service categories deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.patientAccount.deleteMany();
    console.log('✅ Deleted patient accounts');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table patient_accounts doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during patient accounts deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.patient.deleteMany();
    console.log('✅ Deleted patients');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Error during patients deletion: ${error.message}`);
    }
  }

  try {
    await prisma.staffMember.deleteMany();
    console.log('✅ Deleted staff members');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Error during staff members deletion: ${error.message}`);
    }
  }

  try {
    await prisma.user.deleteMany();
    console.log('✅ Deleted users');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Error during users deletion: ${error.message}`);
    } else if (error.code === 'P2003') {
      console.log(
        `⚠️  Foreign key constraint prevents user deletion. Some users may have active relationships.`,
      );
      console.log(
        `⚠️  This is expected behavior - the seeding will continue with existing users.`,
      );
    } else {
      console.log(`⚠️  Error during users deletion: ${error.message}`);
    }
  }

  try {
    await prisma.auditLog.deleteMany();
    console.log('✅ Deleted audit logs');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table audit_logs doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during audit logs deletion: ${error.message}`);
    }
  }
}

async function seedUsers() {
  console.log('👥 Seeding users...');

  // Check if users already exist
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(
      `⚠️  Users already exist (${existingUsers}), skipping user creation`,
    );
    return;
  }

  const users = [
    {
      email: 'admin@hospital.com',
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'John',
      lastName: 'Admin',
      role: UserRole.ADMIN,
    },
    {
      email: 'doctor.smith@hospital.com',
      username: 'dr.smith',
      password: await bcrypt.hash('doctor123', 10),
      firstName: 'Sarah',
      lastName: 'Smith',
      role: UserRole.DOCTOR,
    },
    {
      email: 'doctor.johnson@hospital.com',
      username: 'dr.johnson',
      password: await bcrypt.hash('doctor123', 10),
      firstName: 'Michael',
      lastName: 'Johnson',
      role: UserRole.DOCTOR,
    },
    {
      email: 'nurse.wilson@hospital.com',
      username: 'nurse.wilson',
      password: await bcrypt.hash('nurse123', 10),
      firstName: 'Emily',
      lastName: 'Wilson',
      role: UserRole.NURSE,
    },
    {
      email: 'cashier.brown@hospital.com',
      username: 'cashier.brown',
      password: await bcrypt.hash('cashier123', 10),
      firstName: 'David',
      lastName: 'Brown',
      role: UserRole.CASHIER,
    },
    {
      email: 'pharmacist.davis@hospital.com',
      username: 'pharmacist.davis',
      password: await bcrypt.hash('pharmacist123', 10),
      firstName: 'Lisa',
      lastName: 'Davis',
      role: UserRole.PHARMACIST,
    },
    {
      email: 'lab.tech@hospital.com',
      username: 'lab.tech',
      password: await bcrypt.hash('lab123', 10),
      firstName: 'Robert',
      lastName: 'Taylor',
      role: UserRole.LAB_TECHNICIAN,
    },
  ];

  for (const userData of users) {
    await prisma.user.create({ data: userData });
  }

  console.log(`✅ Created ${users.length} users`);
}

async function seedStaffMembers() {
  console.log('👨‍⚕️ Seeding staff members...');

  // Check if staff members already exist
  const existingStaff = await prisma.staffMember.count();
  if (existingStaff > 0) {
    console.log(
      `⚠️  Staff members already exist (${existingStaff}), skipping staff creation`,
    );
    return;
  }

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@hospital.com' },
  });
  const doctorSmith = await prisma.user.findUnique({
    where: { email: 'doctor.smith@hospital.com' },
  });
  const doctorJohnson = await prisma.user.findUnique({
    where: { email: 'doctor.johnson@hospital.com' },
  });
  const nurseWilson = await prisma.user.findUnique({
    where: { email: 'nurse.wilson@hospital.com' },
  });
  const cashierBrown = await prisma.user.findUnique({
    where: { email: 'cashier.brown@hospital.com' },
  });
  const pharmacistDavis = await prisma.user.findUnique({
    where: { email: 'pharmacist.davis@hospital.com' },
  });
  const labTech = await prisma.user.findUnique({
    where: { email: 'lab.tech@hospital.com' },
  });

  const staffMembers = [
    {
      userId: admin!.id,
      employeeId: 'EMP001',
      department: 'Administration',
      specialization: 'Hospital Management',
      licenseNumber: null,
      hireDate: new Date('2020-01-15'),
    },
    {
      userId: doctorSmith!.id,
      employeeId: 'EMP002',
      department: 'Cardiology',
      specialization: 'Cardiologist',
      licenseNumber: 'MD12345',
      hireDate: new Date('2018-03-20'),
    },
    {
      userId: doctorJohnson!.id,
      employeeId: 'EMP003',
      department: 'Orthopedics',
      specialization: 'Orthopedic Surgeon',
      licenseNumber: 'MD67890',
      hireDate: new Date('2019-06-10'),
    },
    {
      userId: nurseWilson!.id,
      employeeId: 'EMP004',
      department: 'Emergency',
      specialization: 'Emergency Care',
      licenseNumber: 'RN11111',
      hireDate: new Date('2021-02-14'),
    },
    {
      userId: cashierBrown!.id,
      employeeId: 'EMP005',
      department: 'Finance',
      specialization: 'Cash Management',
      licenseNumber: null,
      hireDate: new Date('2020-08-01'),
    },
    {
      userId: pharmacistDavis!.id,
      employeeId: 'EMP006',
      department: 'Pharmacy',
      specialization: 'Clinical Pharmacy',
      licenseNumber: 'PH22222',
      hireDate: new Date('2019-11-15'),
    },
    {
      userId: labTech!.id,
      employeeId: 'EMP007',
      department: 'Laboratory',
      specialization: 'Medical Technology',
      licenseNumber: 'MT33333',
      hireDate: new Date('2021-04-20'),
    },
  ];

  for (const staffData of staffMembers) {
    await prisma.staffMember.create({ data: staffData });
  }

  console.log(`✅ Created ${staffMembers.length} staff members`);
}

async function seedPatients() {
  console.log('🏥 Seeding patients...');

  // Check if patients already exist
  const existingPatients = await prisma.patient.count();
  if (existingPatients > 0) {
    console.log(
      `⚠️  Patients already exist (${existingPatients}), skipping patient creation`,
    );
    return;
  }

  const patients = [
    {
      patientId: 'P001',
      firstName: 'Alice',
      lastName: 'Johnson',
      dateOfBirth: new Date('1985-03-15'),
      gender: Gender.FEMALE,
      phoneNumber: '+1234567890',
      email: 'alice.johnson@email.com',
      address: '123 Main St, City, State 12345',
      emergencyContactName: 'Bob Johnson',
      emergencyContactRelationship: 'Husband',
      emergencyContactPhone: '+1234567891',
      bloodGroup: BloodType.A_POSITIVE,
      allergies: 'Penicillin',
      genotype: Genotype.AA,
      height: '5\'6"',
    },
    {
      patientId: 'P002',
      firstName: 'Bob',
      lastName: 'Williams',
      dateOfBirth: new Date('1978-07-22'),
      gender: Gender.MALE,
      phoneNumber: '+1234567892',
      email: 'bob.williams@email.com',
      address: '456 Oak Ave, City, State 12345',
      emergencyContactName: 'Mary Williams',
      emergencyContactRelationship: 'Wife',
      emergencyContactPhone: '+1234567893',
      bloodGroup: BloodType.O_POSITIVE,
      allergies: 'None',
      genotype: Genotype.AA,
      height: '6\'0"',
    },
    {
      patientId: 'P003',
      firstName: 'Carol',
      lastName: 'Davis',
      dateOfBirth: new Date('1992-11-08'),
      gender: Gender.FEMALE,
      phoneNumber: '+1234567894',
      email: 'carol.davis@email.com',
      address: '789 Pine Rd, City, State 12345',
      emergencyContactName: 'Tom Davis',
      emergencyContactRelationship: 'Father',
      emergencyContactPhone: '+1234567895',
      bloodGroup: BloodType.B_NEGATIVE,
      allergies: 'Latex, Shellfish',
      genotype: Genotype.AS,
      height: '5\'4"',
    },
    {
      patientId: 'P004',
      firstName: 'David',
      lastName: 'Miller',
      dateOfBirth: new Date('1965-05-30'),
      gender: Gender.MALE,
      phoneNumber: '+1234567896',
      email: 'david.miller@email.com',
      address: '321 Elm St, City, State 12345',
      emergencyContactName: 'Jane Miller',
      emergencyContactRelationship: 'Wife',
      emergencyContactPhone: '+1234567897',
      bloodGroup: BloodType.AB_POSITIVE,
      allergies: 'Sulfa drugs',
      genotype: Genotype.AA,
      height: '5\'10"',
    },
    {
      patientId: 'P005',
      firstName: 'Eva',
      lastName: 'Garcia',
      dateOfBirth: new Date('1988-12-12'),
      gender: Gender.FEMALE,
      phoneNumber: '+1234567898',
      email: 'eva.garcia@email.com',
      address: '654 Maple Dr, City, State 12345',
      emergencyContactName: 'Carlos Garcia',
      emergencyContactRelationship: 'Brother',
      emergencyContactPhone: '+1234567899',
      bloodGroup: BloodType.O_NEGATIVE,
      allergies: 'None',
      genotype: Genotype.AA,
      height: '5\'7"',
    },
    {
      patientId: 'P006',
      firstName: 'Michael',
      lastName: 'Chen',
      dateOfBirth: new Date('1990-08-14'),
      gender: Gender.MALE,
      phoneNumber: '+1234567800',
      email: 'michael.chen@email.com',
      address: '987 Cedar Ln, City, State 12345',
      emergencyContactName: 'Sarah Chen',
      emergencyContactRelationship: 'Sister',
      emergencyContactPhone: '+1234567801',
      bloodGroup: BloodType.B_POSITIVE,
      allergies: 'Peanuts',
      genotype: Genotype.AS,
      height: '5\'11"',
    },
    {
      patientId: 'P007',
      firstName: 'Lisa',
      lastName: 'Thompson',
      dateOfBirth: new Date('1983-04-25'),
      gender: Gender.FEMALE,
      phoneNumber: '+1234567802',
      email: 'lisa.thompson@email.com',
      address: '147 Birch St, City, State 12345',
      emergencyContactName: 'John Thompson',
      emergencyContactRelationship: 'Husband',
      emergencyContactPhone: '+1234567803',
      bloodGroup: BloodType.A_NEGATIVE,
      allergies: 'Dairy',
      genotype: Genotype.AA,
      height: '5\'5"',
    },
  ];

  for (const patientData of patients) {
    await prisma.patient.create({ data: patientData });
  }

  console.log(`✅ Created ${patients.length} patients`);
}

async function seedServiceCategories() {
  console.log('🏷️ Seeding service categories...');

  // Check if service categories already exist
  const existingCategories = await prisma.serviceCategory.count();
  if (existingCategories > 0) {
    console.log(
      `⚠️  Service categories already exist (${existingCategories}), skipping category creation`,
    );
    return;
  }

  const categories = [
    {
      name: 'Consultation',
      description: 'Doctor consultations and examinations',
    },
    {
      name: 'Laboratory',
      description: 'Blood tests, urine tests, and other lab services',
    },
    {
      name: 'Radiology',
      description: 'X-rays, CT scans, MRI, and other imaging services',
    },
    { name: 'Surgery', description: 'Surgical procedures and operations' },
    {
      name: 'Pharmacy',
      description: 'Medications and pharmaceutical services',
    },
    {
      name: 'Emergency',
      description: 'Emergency room services and urgent care',
    },
    { name: 'Inpatient', description: 'Hospital stay and ward services' },
    {
      name: 'Rehabilitation',
      description: 'Physical therapy and rehabilitation services',
    },
    {
      name: 'Registration',
      description: 'Patient registration and administrative services',
    },
  ];

  for (const categoryData of categories) {
    await prisma.serviceCategory.create({ data: categoryData });
  }

  console.log(`✅ Created ${categories.length} service categories`);
}

async function seedServices() {
  console.log('🔧 Seeding services...');

  // Check if services already exist
  const existingServices = await prisma.service.count();
  if (existingServices > 0) {
    console.log(
      `⚠️  Services already exist (${existingServices}), skipping service creation`,
    );
    return;
  }

  const consultationCategory = await prisma.serviceCategory.findUnique({
    where: { name: 'Consultation' },
  });
  const labCategory = await prisma.serviceCategory.findUnique({
    where: { name: 'Laboratory' },
  });
  const radiologyCategory = await prisma.serviceCategory.findUnique({
    where: { name: 'Radiology' },
  });
  const surgeryCategory = await prisma.serviceCategory.findUnique({
    where: { name: 'Surgery' },
  });
  const pharmacyCategory = await prisma.serviceCategory.findUnique({
    where: { name: 'Pharmacy' },
  });
  const emergencyCategory = await prisma.serviceCategory.findUnique({
    where: { name: 'Emergency' },
  });
  const inpatientCategory = await prisma.serviceCategory.findUnique({
    where: { name: 'Inpatient' },
  });
  const registrationCategory = await prisma.serviceCategory.findUnique({
    where: { name: 'Registration' },
  });

  const services = [
    // Consultations
    {
      name: 'General Consultation',
      description: 'Basic doctor consultation',
      categoryId: consultationCategory!.id,
      basePrice: 50.0,
      currentPrice: 50.0,
      serviceCode: 'CON001',
      requiresPrePayment: false,
    },
    {
      name: 'Specialist Consultation',
      description: 'Specialist doctor consultation',
      categoryId: consultationCategory!.id,
      basePrice: 100.0,
      currentPrice: 100.0,
      serviceCode: 'CON002',
      requiresPrePayment: false,
    },
    {
      name: 'Emergency Consultation',
      description: 'Emergency room consultation',
      categoryId: emergencyCategory!.id,
      basePrice: 150.0,
      currentPrice: 150.0,
      serviceCode: 'EMG001',
      requiresPrePayment: true,
    },

    // Laboratory
    {
      name: 'Complete Blood Count',
      description: 'CBC blood test',
      categoryId: labCategory!.id,
      basePrice: 25.0,
      currentPrice: 25.0,
      serviceCode: 'LAB001',
      requiresPrePayment: false,
    },
    {
      name: 'Blood Glucose Test',
      description: 'Blood sugar level test',
      categoryId: labCategory!.id,
      basePrice: 15.0,
      currentPrice: 15.0,
      serviceCode: 'LAB002',
      requiresPrePayment: false,
    },
    {
      name: 'Urinalysis',
      description: 'Urine analysis test',
      categoryId: labCategory!.id,
      basePrice: 20.0,
      currentPrice: 20.0,
      serviceCode: 'LAB003',
      requiresPrePayment: false,
    },

    // Radiology
    {
      name: 'Chest X-Ray',
      description: 'Chest X-ray examination',
      categoryId: radiologyCategory!.id,
      basePrice: 80.0,
      currentPrice: 80.0,
      serviceCode: 'RAD001',
      requiresPrePayment: false,
    },
    {
      name: 'CT Scan - Head',
      description: 'Head CT scan',
      categoryId: radiologyCategory!.id,
      basePrice: 300.0,
      currentPrice: 300.0,
      serviceCode: 'RAD002',
      requiresPrePayment: true,
    },

    // Surgery
    {
      name: 'Appendectomy',
      description: 'Surgical removal of appendix',
      categoryId: surgeryCategory!.id,
      basePrice: 5000.0,
      currentPrice: 5000.0,
      serviceCode: 'SUR001',
      requiresPrePayment: true,
    },
    {
      name: 'Hernia Repair',
      description: 'Surgical repair of hernia',
      categoryId: surgeryCategory!.id,
      basePrice: 3500.0,
      currentPrice: 3500.0,
      serviceCode: 'SUR002',
      requiresPrePayment: true,
    },

    // Pharmacy
    {
      name: 'Prescription Medication',
      description: 'General prescription medication',
      categoryId: pharmacyCategory!.id,
      basePrice: 30.0,
      currentPrice: 30.0,
      serviceCode: 'PHM001',
      requiresPrePayment: false,
    },

    // Inpatient
    {
      name: 'General Ward - Daily',
      description: 'Daily charge for general ward stay',
      categoryId: inpatientCategory!.id,
      basePrice: 200.0,
      currentPrice: 200.0,
      serviceCode: 'INP001',
      requiresPrePayment: false,
    },
    {
      name: 'Private Room - Daily',
      description: 'Daily charge for private room stay',
      categoryId: inpatientCategory!.id,
      basePrice: 400.0,
      currentPrice: 400.0,
      serviceCode: 'INP002',
      requiresPrePayment: false,
    },

    // Registration
    {
      name: 'Patient Medical Card',
      description:
        'Patient registration and medical card issuance - Required for hospital service access',
      categoryId: registrationCategory!.id,
      basePrice: 100.0,
      currentPrice: 100.0,
      serviceCode: 'REG001',
      requiresPrePayment: true,
    },
  ];

  for (const serviceData of services) {
    await prisma.service.create({ data: serviceData });
  }

  console.log(`✅ Created ${services.length} services`);
}

async function seedWards() {
  console.log('🏥 Seeding wards...');

  const wards = [
    {
      name: 'General Ward A',
      wardType: WardType.GENERAL,
      floor: '1st Floor',
      capacity: 20,
    },
    {
      name: 'General Ward B',
      wardType: WardType.GENERAL,
      floor: '1st Floor',
      capacity: 20,
    },
    {
      name: 'Private Ward 1',
      wardType: WardType.PRIVATE,
      floor: '2nd Floor',
      capacity: 10,
    },
    {
      name: 'ICU Unit',
      wardType: WardType.ICU,
      floor: '3rd Floor',
      capacity: 8,
    },
    {
      name: 'Maternity Ward',
      wardType: WardType.MATERNITY,
      floor: '2nd Floor',
      capacity: 15,
    },
    {
      name: 'Pediatric Ward',
      wardType: WardType.PEDIATRIC,
      floor: '1st Floor',
      capacity: 12,
    },
  ];

  for (const wardData of wards) {
    await prisma.ward.create({ data: wardData });
  }

  console.log(`✅ Created ${wards.length} wards`);
}

async function seedBeds() {
  console.log('🛏️ Seeding beds...');

  const wards = await prisma.ward.findMany();
  let bedCounter = 1;

  for (const ward of wards) {
    const bedCount = ward.capacity;
    for (let i = 1; i <= bedCount; i++) {
      await prisma.bed.create({
        data: {
          bedNumber: `B${bedCounter.toString().padStart(3, '0')}`,
          wardId: ward.id,
          isOccupied: false,
        },
      });
      bedCounter++;
    }
  }

  console.log('✅ Created beds for all wards');
}

async function seedAdmissions() {
  console.log('🏥 Seeding admissions...');

  const patients = await prisma.patient.findMany({ take: 3 });
  const doctors = await prisma.staffMember.findMany({
    where: { department: { in: ['Cardiology', 'Orthopedics'] } },
    take: 2,
  });
  const wards = await prisma.ward.findMany({ take: 2 });

  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const doctor = doctors[i % doctors.length];
    const ward = wards[i % wards.length];

    await prisma.admission.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        wardId: ward.id,
        bedNumber: `A${(i + 1).toString().padStart(2, '0')}`,
        admissionDate: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ),
        status: i === 0 ? 'ADMITTED' : 'DISCHARGED',
        dischargeDate: i === 0 ? null : new Date(),
        wardType: ward.wardType,
        depositAmount: 1000.0,
        notes: `Admission for ${patient.firstName} ${patient.lastName}`,
        diagnosis: i === 0 ? 'Acute appendicitis' : 'Hernia repair',
      },
    });
  }

  console.log(`✅ Created ${patients.length} admissions`);
}

async function seedConsultations() {
  console.log('👨‍⚕️ Seeding consultations...');

  const patients = await prisma.patient.findMany({ take: 3 });
  const doctors = await prisma.staffMember.findMany({
    where: { department: { in: ['Cardiology', 'Orthopedics'] } },
    take: 2,
  });

  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const doctor = doctors[i % doctors.length];

    await prisma.consultation.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ),
        consultationType: ConsultationType.GENERAL,
        diagnosis: 'Angina pectoris',
        treatment: 'Prescribed nitroglycerin and lifestyle modifications',
        notes: 'Follow-up in 2 weeks',
        isCompleted: true,
      },
    });
  }

  console.log(`✅ Created ${patients.length} consultations`);
}

async function seedLabOrders() {
  console.log('🧪 Seeding lab orders...');

  const patients = await prisma.patient.findMany({ take: 2 });
  const doctors = await prisma.staffMember.findMany({
    where: { department: 'Cardiology' },
    take: 1,
  });

  // Get lab test services (blood tests, etc.)
  const labServices = await prisma.service.findMany({
    where: {
      category: {
        name: 'Laboratory',
      },
    },
    take: 3,
  });

  for (const patient of patients) {
    let totalAmount = 0;
    const tests: any[] = [];

    // Add 2-3 lab tests per order
    const numTests = Math.floor(Math.random() * 2) + 2;
    const selectedServices = labServices.slice(0, numTests);

    for (const service of selectedServices) {
      const unitPrice = Number(service.currentPrice);
      const totalPrice = unitPrice;
      totalAmount += totalPrice;

      tests.push({
        serviceId: service.id,
        status: 'PENDING',
        unitPrice,
        totalPrice,
      } as any);
    }

    const labOrder = await prisma.labOrder.create({
      data: {
        patientId: patient.id,
        doctorId: doctors[0].id,
        orderDate: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        ),
        status: 'PENDING',
        totalAmount,
        balance: totalAmount,
        notes: 'Routine laboratory tests',
        tests: {
          create: tests,
        },
      },
    });

    // Create invoice for the lab order
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `LAB-INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId: patient.id,
        totalAmount,
        balance: totalAmount,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: `Invoice for Lab Order ${labOrder.id}`,
      },
    });

    // Create charges for each test
    for (const test of tests) {
      const service = labServices.find((s) => s.id === test.serviceId);
      if (service) {
        await prisma.charge.create({
          data: {
            invoiceId: invoice.id,
            serviceId: test.serviceId,
            description: `${service.name} - Lab Test`,
            quantity: 1,
            unitPrice: test.unitPrice,
            totalPrice: test.totalPrice,
          },
        });
      }
    }
  }

  console.log(
    `✅ Created ${patients.length} lab orders with tests and invoices`,
  );
}

async function seedPrescriptions() {
  console.log('💊 Seeding prescriptions...');

  const patients = await prisma.patient.findMany({ take: 2 });
  const doctors = await prisma.staffMember.findMany({
    where: { department: 'Cardiology' },
    take: 1,
  });
  const medications = await prisma.medication.findMany({ take: 3 });

  for (const patient of patients) {
    const prescription = await prisma.prescription.create({
      data: {
        patientId: patient.id,
        doctorId: doctors[0].id,
        prescriptionDate: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        ),
        totalAmount: 0, // Will be calculated when medications are added
        balance: 0,
        notes: 'Take medication as prescribed',
        status: PrescriptionStatus.PENDING,
      },
    });

    // Add medications to prescription
    for (const medication of medications) {
      const inventoryItem = await prisma.medicationInventory.findFirst({
        where: { medicationId: medication.id },
      });

      if (inventoryItem) {
        const quantity = Math.floor(Math.random() * 30) + 10; // 10-40 units
        const unitPrice = Number(inventoryItem.sellingPrice);
        const totalPrice = unitPrice * quantity;

        await prisma.prescriptionMedication.create({
          data: {
            prescriptionId: prescription.id,
            medicationId: medication.id,
            dosage: '1 tablet',
            frequency: 'Twice daily',
            duration: '7 days',
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            instructions: 'Take with food',
          },
        });

        // Update prescription total amount
        await prisma.prescription.update({
          where: { id: prescription.id },
          data: {
            totalAmount: {
              increment: totalPrice,
            },
            balance: {
              increment: totalPrice,
            },
          },
        });
      }
    }
  }

  console.log(`✅ Created ${patients.length} prescriptions with medications`);
}

async function seedSurgeries() {
  console.log('🔪 Seeding surgeries...');

  const patients = await prisma.patient.findMany({ take: 2 });
  const surgeons = await prisma.staffMember.findMany({
    where: { department: 'Orthopedics' },
    take: 1,
  });

  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const surgeon = surgeons[0];

    await prisma.surgery.create({
      data: {
        patientId: patient.id,
        surgeonId: surgeon.id,
        surgeryDate: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ),
        surgeryType: i === 0 ? 'Appendectomy' : 'Hernia Repair',
        operatingRoom: `OR${(i + 1).toString().padStart(2, '0')}`,
        duration: i === 0 ? 90 : 120,
        status: 'COMPLETED',
        notes: `Surgery completed successfully for ${patient.firstName} ${patient.lastName}`,
      },
    });
  }

  console.log(`✅ Created ${patients.length} surgeries`);
}

async function seedInvoices() {
  console.log('🧾 Seeding invoices...');

  const patients = await prisma.patient.findMany({ take: 3 });

  for (const patient of patients) {
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        patientId: patient.id,
        totalAmount: 500.0,
        paidAmount: 300.0,
        balance: 200.0,
        status: 'PARTIAL',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: `Invoice for ${patient.firstName} ${patient.lastName}`,
      },
    });
  }

  console.log(`✅ Created ${patients.length} invoices`);
}

async function seedCharges() {
  console.log('💰 Seeding charges...');

  const invoices = await prisma.invoice.findMany();
  const services = await prisma.service.findMany({ take: 3 });

  for (const invoice of invoices) {
    for (const service of services) {
      await prisma.charge.create({
        data: {
          invoiceId: invoice.id,
          serviceId: service.id,
          description: `Charge for ${service.name}`,
          quantity: 1,
          unitPrice: service.currentPrice,
          totalPrice: service.currentPrice,
        },
      });
    }
  }

  console.log('✅ Created charges for all invoices');
}

async function seedPayments() {
  console.log('💳 Seeding payments...');

  const invoices = await prisma.invoice.findMany();
  const cashier = await prisma.staffMember.findFirst({
    where: { department: 'Finance' },
  });

  for (const invoice of invoices) {
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        amount: 300.0,
        method: 'CASH',
        reference: `PAY${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        status: 'COMPLETED',
        processedBy: cashier!.id,
        notes: 'Payment received',
      },
    });
  }

  console.log(`✅ Created payments for ${invoices.length} invoices`);
}

async function seedCashTransactions() {
  console.log('💵 Seeding cash transactions...');

  const cashier = await prisma.staffMember.findFirst({
    where: { department: 'Finance' },
  });
  const patients = await prisma.patient.findMany({ take: 2 });

  for (const patient of patients) {
    await prisma.cashTransaction.create({
      data: {
        cashierId: cashier!.id,
        patientId: patient.id,
        transactionType: TransactionType.CASH_IN,
        amount: 150.0,
        description: 'Payment for consultation',
        referenceNumber: `CT${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        notes: 'Cash payment received',
      },
    });
  }

  console.log(`✅ Created ${patients.length} cash transactions`);
}

async function seedPettyCash() {
  console.log('💸 Seeding petty cash requests...');

  const nurse = await prisma.staffMember.findFirst({
    where: { department: 'Emergency' },
  });
  const admin = await prisma.staffMember.findFirst({
    where: { department: 'Administration' },
  });

  if (nurse && admin) {
    await prisma.pettyCash.create({
      data: {
        requesterId: nurse.id,
        approverId: admin.id,
        amount: 50.0,
        purpose: 'Emergency supplies',
        description: 'Need to purchase bandages and antiseptics',
        status: 'APPROVED',
        notes: 'Approved for emergency department needs',
      },
    });
  }

  console.log('✅ Created petty cash request');
}

async function seedCashRequests() {
  console.log('💰 Seeding cash requests...');

  const staffMembers = await prisma.staffMember.findMany({
    where: {
      department: { in: ['Finance', 'Pharmacy', 'Laboratory', 'Emergency'] },
    },
    take: 4,
  });

  const cashier = await prisma.staffMember.findFirst({
    where: { department: 'Finance' },
  });

  if (staffMembers.length > 0 && cashier) {
    // Create cash requests based on available staff members
    const cashRequests: Array<{
      requesterId: string;
      department: string;
      purpose: string;
      amount: number;
      urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
      status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
      notes: string;
      attachments: string[];
    }> = [];

    if (staffMembers.length > 0) {
      cashRequests.push({
        requesterId: staffMembers[0].id,
        department: staffMembers[0].department,
        purpose: 'Computer equipment purchase',
        amount: 250.0,
        urgency: 'HIGH',
        status: 'PENDING',
        notes: 'Need to replace 2 broken laptops',
        attachments: ['/uploads/quote1.pdf', '/uploads/quote2.pdf'],
      });
    }

    if (staffMembers.length > 1) {
      cashRequests.push({
        requesterId: staffMembers[1].id,
        department: staffMembers[1].department,
        purpose: 'Plumbing supplies',
        amount: 75.0,
        urgency: 'NORMAL',
        status: 'APPROVED',
        notes: 'Regular maintenance supplies',
        attachments: ['/uploads/supplies-list.pdf'],
      });
    }

    if (staffMembers.length > 2) {
      cashRequests.push({
        requesterId: staffMembers[2].id,
        department: staffMembers[2].department,
        purpose: 'Medical supplies restock',
        amount: 180.0,
        urgency: 'URGENT',
        status: 'PENDING',
        notes: 'Critical supplies running low',
        attachments: ['/uploads/inventory-report.pdf'],
      });
    }

    if (staffMembers.length > 3) {
      cashRequests.push({
        requesterId: staffMembers[3].id,
        department: staffMembers[3].department,
        purpose: 'Office stationery',
        amount: 45.0,
        urgency: 'LOW',
        status: 'APPROVED',
        notes: 'Monthly office supplies',
        attachments: [],
      });
    }

    for (const requestData of cashRequests) {
      const cashRequest = await prisma.cashRequest.create({
        data: {
          ...requestData,
          requestNumber: `CR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
            Math.random() * 1000,
          )
            .toString()
            .padStart(3, '0')}`,
        },
      });

      // If the request is approved, create a cash transaction
      if (requestData.status === 'APPROVED') {
        await prisma.cashTransaction.create({
          data: {
            cashierId: cashier.id,
            cashRequestId: cashRequest.id,
            transactionType: TransactionType.CASH_OUT,
            amount: requestData.amount,
            description: `Cash disbursement for request ${cashRequest.requestNumber}: ${requestData.purpose}`,
            referenceNumber: `CR-${cashRequest.requestNumber}`,
            notes: `Approved cash request: ${requestData.purpose}`,
            status: 'COMPLETED',
          },
        });
      }
    }

    console.log(`✅ Created ${cashRequests.length} cash requests`);
  } else {
    console.log('⚠️ Skipping cash requests - insufficient staff members');
  }
}

async function seedDispensedMedications() {
  console.log('💊 Seeding dispensed medications...');

  const prescriptionMedications = await prisma.prescriptionMedication.findMany({
    take: 3,
  });
  const inventoryItems = await prisma.medicationInventory.findMany({ take: 3 });
  const pharmacist = await prisma.staffMember.findFirst({
    where: { department: 'Pharmacy' },
  });

  if (
    prescriptionMedications.length > 0 &&
    inventoryItems.length > 0 &&
    pharmacist
  ) {
    for (
      let i = 0;
      i < Math.min(prescriptionMedications.length, inventoryItems.length);
      i++
    ) {
      await prisma.dispensedMedication.create({
        data: {
          prescriptionMedicationId: prescriptionMedications[i].id,
          inventoryItemId: inventoryItems[i].id,
          quantity: 1,
          dispensedBy: pharmacist.id,
          dispensedAt: new Date(),
          batchNumber: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          notes: 'Medication dispensed as prescribed',
        },
      });
    }

    console.log(
      `✅ Created ${Math.min(prescriptionMedications.length, inventoryItems.length)} dispensed medications`,
    );
  } else {
    console.log('⚠️ Skipping dispensed medications - insufficient data');
  }
}

async function seedPaystackCustomers() {
  console.log('🏦 Seeding Paystack customers...');

  const patients = await prisma.patient.findMany({ take: 3 });

  for (const patient of patients) {
    await prisma.paystackCustomer.create({
      data: {
        patientId: patient.id,
        paystackCustomerId: `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        customerCode: `CUST_${patient.patientId.slice(-6)}`,
        email:
          patient.email || `patient.${patient.patientId.slice(-6)}@example.com`,
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phoneNumber,
        metadata: {
          patientId: patient.patientId,
          registrationDate: patient.createdAt,
        },
      },
    });
  }

  console.log(`✅ Created ${patients.length} Paystack customers`);
}

async function seedPaystackInvoices() {
  console.log('🧾 Seeding Paystack invoices...');

  const paystackCustomers = await prisma.paystackCustomer.findMany({ take: 2 });
  const invoices = await prisma.invoice.findMany({ take: 2 });

  if (paystackCustomers.length > 0 && invoices.length > 0) {
    for (
      let i = 0;
      i < Math.min(paystackCustomers.length, invoices.length);
      i++
    ) {
      await prisma.paystackInvoice.create({
        data: {
          localInvoiceId: invoices[i].id,
          paystackCustomerId: paystackCustomers[i].id,
          paystackInvoiceId: `INV_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          requestCode: `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          status: 'PENDING',
          amount: invoices[i].totalAmount,
          currency: 'NGN',
          description: `Invoice ${invoices[i].invoiceNumber}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          hasInvoice: true,
          invoiceNumber: invoices[i].invoiceNumber,
        },
      });
    }

    console.log(
      `✅ Created ${Math.min(paystackCustomers.length, invoices.length)} Paystack invoices`,
    );
  } else {
    console.log('⚠️ Skipping Paystack invoices - insufficient data');
  }
}

async function seedAppointmentSlots() {
  console.log('🌅 Seeding appointment slots...');

  // Get staff members (these are the only ones that can have slots in current schema)
  const staffDoctors = await prisma.staffMember.findMany({
    take: 5, // Increased to get more doctors
    include: {
      user: true, // Include the user data
    },
  });

  // Note: User doctors cannot have slots in current schema - only StaffMember can
  console.log(
    '⚠️  Note: Only StaffMember doctors can have appointment slots in current schema',
  );
  console.log(
    '⚠️  User doctors with DOCTOR role cannot have slots until schema is updated',
  );

  const allDoctors = staffDoctors; // Only use staff doctors for now

  if (allDoctors.length === 0) {
    console.log('⚠️ Skipping appointment slots - no doctors found');
    return;
  }

  console.log(
    `📋 Found ${staffDoctors.length} staff doctors (only these can have slots in current schema)`,
  );

  // Log the specific doctors that will get slots
  console.log('🏥 Staff Doctors (will get slots):');
  staffDoctors.forEach((doctor, index) => {
    console.log(
      `  ${index + 1}. ${doctor.user.firstName} ${doctor.user.lastName} (ID: ${doctor.id})`,
    );
  });

  const slots: any[] = [];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const dayAfterTomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create slots for tomorrow
  for (const doctor of allDoctors) {
    console.log(`📅 Creating slots for doctor ID: ${doctor.id} (tomorrow)`);
    for (let hour = 9; hour <= 16; hour++) {
      if (hour === 12) continue; // Skip lunch hour
      slots.push(
        prisma.appointmentSlot.create({
          data: {
            providerId: doctor.id,
            startTime: new Date(tomorrow.getTime() + hour * 60 * 60 * 1000),
            endTime: new Date(
              tomorrow.getTime() + (hour + 0.5) * 60 * 60 * 1000,
            ),
            duration: 30,
            slotType: 'CONSULTATION',
            isAvailable: true,
            isBookable: true,
            maxBookings: 1,
            currentBookings: 0,
            bufferTimeBefore: 0,
            bufferTimeAfter: 0,
            specialty: 'General Medicine',
          },
        }),
      );
      slots.push(
        prisma.appointmentSlot.create({
          data: {
            providerId: doctor.id,
            startTime: new Date(
              tomorrow.getTime() + (hour + 0.5) * 60 * 60 * 1000,
            ),
            endTime: new Date(tomorrow.getTime() + (hour + 1) * 60 * 60 * 1000),
            duration: 30,
            slotType: 'CONSULTATION',
            isAvailable: true,
            isBookable: true,
            maxBookings: 1,
            currentBookings: 0,
            bufferTimeBefore: 0,
            bufferTimeAfter: 0,
            specialty: 'General Medicine',
          },
        }),
      );
    }
  }

  // Create slots for next week
  for (const doctor of allDoctors) {
    for (let hour = 9; hour <= 16; hour++) {
      if (hour === 12) continue; // Skip lunch hour
      slots.push(
        prisma.appointmentSlot.create({
          data: {
            providerId: doctor.id,
            startTime: new Date(nextWeek.getTime() + hour * 60 * 60 * 1000),
            endTime: new Date(
              nextWeek.getTime() + (hour + 0.5) * 60 * 60 * 1000,
            ),
            duration: 30,
            slotType: 'CONSULTATION',
            isAvailable: true,
            isBookable: true,
            maxBookings: 1,
            currentBookings: 0,
            bufferTimeBefore: 0,
            bufferTimeAfter: 0,
            specialty: 'General Medicine',
          },
        }),
      );
      slots.push(
        prisma.appointmentSlot.create({
          data: {
            providerId: doctor.id,
            startTime: new Date(
              nextWeek.getTime() + (hour + 0.5) * 60 * 60 * 1000,
            ),
            endTime: new Date(nextWeek.getTime() + (hour + 1) * 60 * 60 * 1000),
            duration: 30,
            slotType: 'CONSULTATION',
            isAvailable: true,
            isBookable: true,
            maxBookings: 1,
            currentBookings: 0,
            bufferTimeBefore: 0,
            bufferTimeAfter: 0,
            specialty: 'General Medicine',
          },
        }),
      );
    }
  }

  // Create slots for day after tomorrow
  for (const doctor of allDoctors) {
    for (let hour = 9; hour <= 16; hour++) {
      if (hour === 12) continue; // Skip lunch hour
      slots.push(
        prisma.appointmentSlot.create({
          data: {
            providerId: doctor.id,
            startTime: new Date(
              dayAfterTomorrow.getTime() + hour * 60 * 60 * 1000,
            ),
            endTime: new Date(
              dayAfterTomorrow.getTime() + (hour + 0.5) * 60 * 60 * 1000,
            ),
            duration: 30,
            slotType: 'CONSULTATION',
            isAvailable: true,
            isBookable: true,
            maxBookings: 1,
            currentBookings: 0,
            bufferTimeBefore: 0,
            bufferTimeAfter: 0,
            specialty: 'General Medicine',
          },
        }),
      );
      slots.push(
        prisma.appointmentSlot.create({
          data: {
            providerId: doctor.id,
            startTime: new Date(
              dayAfterTomorrow.getTime() + (hour + 0.5) * 60 * 60 * 1000,
            ),
            endTime: new Date(
              dayAfterTomorrow.getTime() + (hour + 1) * 60 * 60 * 1000,
            ),
            duration: 30,
            slotType: 'CONSULTATION',
            isAvailable: true,
            isBookable: true,
            maxBookings: 1,
            currentBookings: 0,
            bufferTimeBefore: 0,
            bufferTimeAfter: 0,
            specialty: 'General Medicine',
          },
        }),
      );
    }
  }

  const createdSlots = await Promise.all(slots);
  console.log(
    `✅ Created ${createdSlots.length} appointment slots for ${allDoctors.length} doctors`,
  );
  return createdSlots;
}

async function seedAppointments() {
  console.log('📅 Seeding appointments...');

  const patients = await prisma.patient.findMany({ take: 5 });
  const slots = await prisma.appointmentSlot.findMany({ take: 10 });
  const doctors = await prisma.staffMember.findMany({
    take: 2,
  });

  if (patients.length === 0 || slots.length === 0 || doctors.length === 0) {
    console.log('⚠️ Skipping appointments - insufficient data');
    return;
  }

  const appointments: any[] = [];
  const appointmentTypes: Array<
    | 'GENERAL_CONSULTATION'
    | 'SPECIALIST_CONSULTATION'
    | 'LAB_TEST'
    | 'IMAGING'
    | 'SURGERY'
    | 'FOLLOW_UP'
    | 'EMERGENCY'
    | 'TELEMEDICINE'
    | 'PREVENTIVE_CARE'
  > = ['GENERAL_CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'PREVENTIVE_CARE'];
  const priorities: Array<
    'ROUTINE' | 'URGENT' | 'EMERGENCY' | 'VIP' | 'FOLLOW_UP'
  > = ['ROUTINE', 'URGENT', 'EMERGENCY', 'FOLLOW_UP'];
  const statuses: Array<
    | 'SCHEDULED'
    | 'CONFIRMED'
    | 'CHECKED_IN'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW'
    | 'RESCHEDULED'
  > = ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'];

  for (let i = 0; i < Math.min(patients.length, slots.length); i++) {
    const slot = slots[i];
    const patient = patients[i];
    const doctor = doctors[i % doctors.length];
    const status = statuses[i % statuses.length];
    const appointmentType = appointmentTypes[i % appointmentTypes.length];
    const priority = priorities[i % priorities.length];

    appointments.push(
      prisma.appointment.create({
        data: {
          patientId: patient.id,
          slotId: slot.id,
          providerId: doctor.id,
          status,
          appointmentType,
          priority,
          reason: `Appointment for ${appointmentType.toLowerCase()}`,
          symptoms:
            i % 2 === 0 ? 'General consultation needed' : 'Follow-up required',
          notes: `Seeded appointment ${i + 1}`,
          totalAmount: 5000 + i * 1000,
          balance: 5000 + i * 1000,
          requiresPrePayment: i % 3 !== 0,
          scheduledStart: slot.startTime,
          scheduledEnd: slot.endTime,
        },
      }),
    );
  }

  const createdAppointments = await Promise.all(appointments);
  console.log(`✅ Created ${createdAppointments.length} appointments`);
  return createdAppointments;
}

async function seedNotificationTemplates() {
  console.log('📧 Seeding notification templates...');

  const templates = [
    {
      name: 'Appointment Confirmation',
      subject: 'Appointment Confirmed - {appointmentDate}',
      content:
        'Dear {patientName}, your appointment with Dr. {providerName} has been confirmed for {appointmentDate} at {appointmentTime}. Please arrive 15 minutes early.',
      channel: 'EMAIL' as const,
      type: 'APPOINTMENT_CONFIRMATION',
      isActive: true,
      variables: [
        'patientName',
        'providerName',
        'appointmentDate',
        'appointmentTime',
      ],
    },
    {
      name: 'Appointment Reminder',
      subject: 'Reminder: Appointment Tomorrow at {appointmentTime}',
      content:
        'Hi {patientName}, this is a reminder for your appointment with Dr. {providerName} tomorrow at {appointmentTime}. Please confirm your attendance.',
      channel: 'SMS' as const,
      type: 'APPOINTMENT_REMINDER',
      isActive: true,
      variables: ['patientName', 'providerName', 'appointmentTime'],
    },
    {
      name: 'Payment Due',
      subject: 'Payment Due for Appointment - {appointmentDate}',
      content:
        'Dear {patientName}, payment of {amount} is due for your appointment on {appointmentDate}. Please complete payment before your visit.',
      channel: 'EMAIL' as const,
      type: 'PAYMENT_REMINDER',
      isActive: true,
      variables: ['patientName', 'amount', 'appointmentDate'],
    },
    {
      name: 'Appointment Cancelled',
      subject: 'Appointment Cancelled - {appointmentDate}',
      content:
        'Dear {patientName}, your appointment with Dr. {providerName} on {appointmentDate} has been cancelled. Please contact us to reschedule.',
      channel: 'SMS' as const,
      type: 'APPOINTMENT_CANCELLATION',
      isActive: true,
      variables: ['patientName', 'providerName', 'appointmentDate'],
    },
    {
      name: 'Welcome Message',
      subject: 'Welcome to Our Healthcare Facility',
      content:
        'Welcome {patientName}! Thank you for choosing our healthcare facility. We look forward to providing you with excellent care.',
      channel: 'EMAIL' as const,
      type: 'GENERAL_ANNOUNCEMENT',
      isActive: true,
      variables: ['patientName'],
    },
  ];

  const createdTemplates = await Promise.all(
    templates.map((template) =>
      prisma.notificationTemplate.create({ data: template }),
    ),
  );

  console.log(`✅ Created ${createdTemplates.length} notification templates`);
  return createdTemplates;
}

async function seedNotifications() {
  console.log('🔔 Seeding notifications...');

  const patients = await prisma.patient.findMany({ take: 5 });
  const doctors = await prisma.staffMember.findMany({
    take: 2,
  });
  const templates = await prisma.notificationTemplate.findMany({ take: 3 });
  const appointments = await prisma.appointment.findMany({ take: 5 });

  if (patients.length === 0 || templates.length === 0) {
    console.log('⚠️ Skipping notifications - insufficient data');
    return;
  }

  const notifications: any[] = [];
  const channels: Array<'EMAIL' | 'SMS' | 'PUSH_NOTIFICATION' | 'IN_APP'> = [
    'EMAIL',
    'SMS',
    'PUSH_NOTIFICATION',
    'IN_APP',
  ];
  const types: Array<
    | 'APPOINTMENT_CONFIRMATION'
    | 'APPOINTMENT_REMINDER'
    | 'PAYMENT_REMINDER'
    | 'GENERAL_ANNOUNCEMENT'
  > = [
    'APPOINTMENT_CONFIRMATION',
    'APPOINTMENT_REMINDER',
    'PAYMENT_REMINDER',
    'GENERAL_ANNOUNCEMENT',
  ];
  const priorities: Array<'NORMAL' | 'HIGH' | 'URGENT'> = [
    'NORMAL',
    'HIGH',
    'URGENT',
  ];
  const statuses: Array<'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ'> =
    ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ'];

  for (let i = 0; i < Math.min(patients.length * 2, 20); i++) {
    const patient = patients[i % patients.length];
    const template = templates[i % templates.length];
    const channel = channels[i % channels.length];
    const type = types[i % types.length];
    const priority = priorities[i % priorities.length];
    const status = statuses[i % statuses.length];

    const sentAt =
      status === 'PENDING'
        ? null
        : new Date(Date.now() - i * 2 * 60 * 60 * 1000);

    notifications.push(
      prisma.notification.create({
        data: {
          recipientId: patient.id,
          recipientType: 'PATIENT',
          subject: `Test ${type} notification ${i + 1}`,
          content: `This is a test ${type.toLowerCase()} notification for ${patient.firstName} ${patient.lastName}.`,
          channel,
          type,
          priority,
          status,
          sentAt,
          scheduledFor:
            status === 'PENDING'
              ? new Date(Date.now() + (i + 1) * 60 * 60 * 1000)
              : null,
          metadata: {
            templateId: template.id,
            appointmentId: appointments[i % appointments.length]?.id,
            testData: true,
          },
        },
      }),
    );
  }

  // Add some staff notifications
  for (let i = 0; i < Math.min(doctors.length, 3); i++) {
    const doctor = doctors[i];
    const template = templates[i % templates.length];

    notifications.push(
      prisma.notification.create({
        data: {
          recipientId: doctor.id,
          recipientType: 'STAFF',
          subject: `New Appointment Scheduled - ${new Date().toLocaleDateString()}`,
          content: `Dr. ${doctor.employeeId}, you have new appointments scheduled for today.`,
          channel: 'IN_APP',
          type: 'APPOINTMENT_CONFIRMATION',
          priority: 'NORMAL',
          status: 'READ',
          sentAt: new Date(Date.now() - (i + 1) * 60 * 60 * 1000),
          metadata: {
            templateId: template.id,
            testData: true,
          },
        },
      }),
    );
  }

  const createdNotifications = await Promise.all(notifications);
  console.log(`✅ Created ${createdNotifications.length} notifications`);
  return createdNotifications;
}

async function seedProviderSchedules() {
  console.log('📋 Seeding provider schedules...');

  const doctors = await prisma.staffMember.findMany({
    take: 3,
  });

  if (doctors.length === 0) {
    console.log('⚠️ Skipping provider schedules - no doctors found');
    return;
  }

  const schedules: any[] = [];
  const daysOfWeek = [1, 2, 3, 4, 5]; // Monday to Friday

  for (const doctor of doctors) {
    for (const day of daysOfWeek) {
      schedules.push(
        prisma.providerSchedule.create({
          data: {
            providerId: doctor.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: true,
            maxAppointments: 16,
            breakStart: '12:00',
            breakEnd: '13:00',
            slotDuration: 30,
            bufferTime: 15,
          },
        }),
      );
    }
  }

  const createdSchedules = await Promise.all(schedules);
  console.log(`✅ Created ${createdSchedules.length} provider schedules`);
  return createdSchedules;
}

async function seedProviderTimeOff() {
  console.log('🏖️ Seeding provider time off...');

  const doctors = await prisma.staffMember.findMany({
    take: 2,
  });

  if (doctors.length === 0) {
    console.log('⚠️ Skipping provider time off - no doctors found');
    return;
  }

  const timeOff = [
    {
      providerId: doctors[0].id,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      reason: 'Personal leave',
      type: 'PERSONAL_LEAVE' as const,
      status: 'APPROVED' as const,
    },
    {
      providerId: doctors[1].id,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 2 weeks + 2 days
      reason: 'Conference attendance',
      type: 'CONFERENCE' as const,
      status: 'APPROVED' as const,
    },
  ];

  const createdTimeOff = await Promise.all(
    timeOff.map((record) => prisma.providerTimeOff.create({ data: record })),
  );

  console.log(`✅ Created ${createdTimeOff.length} provider time off records`);
  return createdTimeOff;
}

async function seedResources() {
  console.log('🏥 Seeding resources...');

  const resources = [
    {
      name: 'Consultation Room 1',
      type: 'CONSULTATION_ROOM' as const,
      capacity: 1,
      isActive: true,
      location: 'Ground Floor, Wing A',
      notes: 'Standard consultation room with examination table',
    },
    {
      name: 'Consultation Room 2',
      type: 'CONSULTATION_ROOM' as const,
      capacity: 1,
      isActive: true,
      location: 'Ground Floor, Wing A',
      notes: 'Standard consultation room with examination table',
    },
    {
      name: 'X-Ray Machine',
      type: 'EQUIPMENT' as const,
      capacity: 1,
      isActive: true,
      location: 'First Floor, Imaging Department',
      notes: 'Digital X-ray machine for diagnostic imaging',
    },
    {
      name: 'Ultrasound Machine',
      type: 'EQUIPMENT' as const,
      capacity: 1,
      isActive: true,
      location: 'First Floor, Imaging Department',
      notes: 'Portable ultrasound machine for diagnostic imaging',
    },
  ];

  const createdResources = await Promise.all(
    resources.map((resource) => prisma.resource.create({ data: resource })),
  );

  console.log(`✅ Created ${createdResources.length} resources`);
  return createdResources;
}

async function seedResourceSchedules() {
  console.log('📅 Seeding resource schedules...');

  const resources = await prisma.resource.findMany({ take: 4 });

  if (resources.length === 0) {
    console.log('⚠️ Skipping resource schedules - no resources found');
    return;
  }

  const schedules: any[] = [];
  const daysOfWeek = [1, 2, 3, 4, 5]; // Monday to Friday

  for (const resource of resources) {
    for (const day of daysOfWeek) {
      schedules.push(
        prisma.resourceSchedule.create({
          data: {
            resourceId: resource.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: true,
          },
        }),
      );
    }
  }

  const createdSchedules = await Promise.all(schedules);
  console.log(`✅ Created ${createdSchedules.length} resource schedules`);
  return createdSchedules;
}

async function seedPatientPreferences() {
  console.log('⚙️ Seeding patient preferences...');

  const patients = await prisma.patient.findMany({ take: 5 });

  if (patients.length === 0) {
    console.log('⚠️ Skipping patient preferences - no patients found');
    return;
  }

  const preferences: any[] = [];
  const preferenceTypes: Array<
    | 'PROVIDER_PREFERENCE'
    | 'TIME_PREFERENCE'
    | 'LOCATION_PREFERENCE'
    | 'COMMUNICATION_PREFERENCE'
    | 'SPECIAL_NEEDS'
  > = [
    'PROVIDER_PREFERENCE',
    'TIME_PREFERENCE',
    'LOCATION_PREFERENCE',
    'COMMUNICATION_PREFERENCE',
    'SPECIAL_NEEDS',
  ];
  const preferenceValues = {
    PROVIDER_PREFERENCE: ['Dr. Smith', 'Dr. Johnson', 'Dr. Brown'],
    TIME_PREFERENCE: ['MORNING', 'AFTERNOON', 'EVENING'],
    LOCATION_PREFERENCE: ['Main Building', 'Wing A', 'Wing B'],
    COMMUNICATION_PREFERENCE: ['EMAIL', 'SMS', 'PHONE'],
    SPECIAL_NEEDS: ['Wheelchair Access', 'Sign Language', 'None'],
  };

  for (const patient of patients) {
    for (const type of preferenceTypes) {
      const values = preferenceValues[type as keyof typeof preferenceValues];
      const value = values[Math.floor(Math.random() * values.length)];

      preferences.push(
        prisma.patientPreference.create({
          data: {
            patientId: patient.id,
            preferenceType: type,
            preferenceValue: value,
            isActive: Math.random() > 0.3, // 70% active
          },
        }),
      );
    }
  }

  const createdPreferences = await Promise.all(preferences);
  console.log(`✅ Created ${createdPreferences.length} patient preferences`);
  return createdPreferences;
}

async function seedWaitlistEntries() {
  console.log('⏳ Seeding waitlist entries...');

  const patients = await prisma.patient.findMany({ take: 3 });
  const appointments = await prisma.appointment.findMany({ take: 3 });
  const doctors = await prisma.staffMember.findMany({
    take: 2,
  });

  if (
    patients.length === 0 ||
    appointments.length === 0 ||
    doctors.length === 0
  ) {
    console.log('⚠️ Skipping waitlist entries - insufficient data');
    return;
  }

  const waitlistEntries: any[] = [];
  const priorities: Array<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'> = [
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT',
  ];
  const statuses: Array<'ACTIVE' | 'FILLED' | 'CANCELLED' | 'EXPIRED'> = [
    'ACTIVE',
    'FILLED',
    'CANCELLED',
    'EXPIRED',
  ];

  // Create one waitlist entry per appointment (due to unique constraint)
  for (let i = 0; i < Math.min(appointments.length, 3); i++) {
    const appointment = appointments[i];
    const patient = patients[i % patients.length];
    const priority = priorities[i % priorities.length];
    const status = statuses[i % statuses.length];

    waitlistEntries.push(
      prisma.waitlistEntry.create({
        data: {
          patientId: patient.id,
          appointmentId: appointment.id,
          requestedDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          preferredTimeSlots: ['09:00', '14:00', '16:00'],
          priority,
          status,
          notes: `No available slots for preferred time - ${priority} priority`,
        },
      }),
    );
  }

  const createdEntries = await Promise.all(waitlistEntries);
  console.log(`✅ Created ${createdEntries.length} waitlist entries`);
  return createdEntries;
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
