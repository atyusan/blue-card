import {
  PrismaClient,
  UserRole,
  Gender,
  WardType,
  ConsultationType,
  PrescriptionStatus,
  TransactionType,
  BloodType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await clearDatabase();

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
  await seedSurgeries();
  await seedSurgicalProcedures();
  await seedOperatingRoomBookings();
  await seedInvoices();
  await seedCharges();
  await seedPayments();
  await seedRefunds();
  await seedCashTransactions();
  await seedPettyCash();
  await seedAuditLogs();

  console.log('✅ Database seeding completed successfully!');
}

// ===== PHARMACY SEEDING FUNCTIONS =====

async function seedMedications() {
  console.log('💊 Seeding medications...');

  const medications = [
    {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      strength: '500mg',
      form: 'Tablet',
      manufacturer: 'ABC Pharmaceuticals',
      drugCode: 'PARA500',
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
      drugCode: 'AMOX250',
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
      drugCode: 'IBUP400',
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
      drugCode: 'OMEP20',
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
      drugCode: 'MORP10',
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
      drugCode: 'DIAZ5',
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

  for (const patient of patients) {
    await prisma.patientAccount.create({
      data: {
        patientId: patient.id,
        accountNumber: `ACC-${patient.patientId}-${Date.now()}`,
        balance: Math.random() * 1000, // Random balance between 0-1000
        creditLimit: 5000,
      },
    });
  }

  console.log(`✅ Created ${patients.length} patient accounts`);
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

  // Delete in reverse order of dependencies with error handling
  try {
    await prisma.pettyCash.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table petty_cash doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during petty_cash deletion: ${error.message}`);
    }
  }

  try {
    await prisma.cashTransaction.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table cash_transactions doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during cash_transactions deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.refund.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table refunds doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during refunds deletion: ${error.message}`);
    }
  }

  try {
    await prisma.payment.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table payments doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during payments deletion: ${error.message}`);
    }
  }

  try {
    await prisma.charge.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table charges doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during charges deletion: ${error.message}`);
    }
  }

  try {
    await prisma.invoice.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table invoices doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during invoices deletion: ${error.message}`);
    }
  }

  try {
    await prisma.dailyCharge.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table daily_charges doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during daily_charges deletion: ${error.message}`);
    }
  }

  try {
    await prisma.admission.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table admissions doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during admissions deletion: ${error.message}`);
    }
  }

  try {
    await prisma.surgery.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table surgeries doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during surgeries deletion: ${error.message}`);
    }
  }

  try {
    await prisma.dispensedMedication.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table dispensed_medications doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during dispensed_medications deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.medicationInventory.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table medication_inventory doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during medication_inventory deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.medication.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table medications doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during medications deletion: ${error.message}`);
    }
  }

  try {
    await prisma.prescriptionMedication.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table prescription_medications doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during prescription_medications deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.prescription.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table prescriptions doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during prescriptions deletion: ${error.message}`);
    }
  }

  try {
    await prisma.labTest.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table lab_tests doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during lab_tests deletion: ${error.message}`);
    }
  }

  try {
    await prisma.labOrder.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table lab_orders doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during lab_orders deletion: ${error.message}`);
    }
  }

  try {
    await prisma.consultation.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table consultations doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during consultations deletion: ${error.message}`);
    }
  }

  try {
    await prisma.bed.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table beds doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during beds deletion: ${error.message}`);
    }
  }

  try {
    await prisma.ward.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table wards doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during wards deletion: ${error.message}`);
    }
  }

  try {
    await prisma.service.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table services doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during services deletion: ${error.message}`);
    }
  }

  try {
    await prisma.serviceCategory.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table service_categories doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during service_categories deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.patientAccount.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(
        `⚠️  Table patient_accounts doesn't exist, skipping deletion`,
      );
    } else {
      console.log(
        `⚠️  Error during patient_accounts deletion: ${error.message}`,
      );
    }
  }

  try {
    await prisma.patient.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table patients doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during patients deletion: ${error.message}`);
    }
  }

  try {
    await prisma.staffMember.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table staff_members doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during staff_members deletion: ${error.message}`);
    }
  }

  try {
    await prisma.user.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table users doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during users deletion: ${error.message}`);
    }
  }

  try {
    await prisma.auditLog.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️  Table audit_logs doesn't exist, skipping deletion`);
    } else {
      console.log(`⚠️  Error during audit_logs deletion: ${error.message}`);
    }
  }
}

async function seedUsers() {
  console.log('👥 Seeding users...');

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
      emergencyContact: 'Bob Johnson',
      emergencyPhone: '+1234567891',
      bloodType: BloodType.A_POSITIVE,
      allergies: 'Penicillin',
      medicalHistory: 'Hypertension, Diabetes Type 2',
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
      emergencyContact: 'Mary Williams',
      emergencyPhone: '+1234567893',
      bloodType: BloodType.O_POSITIVE,
      allergies: 'None',
      medicalHistory: 'Asthma',
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
      emergencyContact: 'Tom Davis',
      emergencyPhone: '+1234567895',
      bloodType: BloodType.B_NEGATIVE,
      allergies: 'Latex, Shellfish',
      medicalHistory: 'Migraine',
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
      emergencyContact: 'Jane Miller',
      emergencyPhone: '+1234567897',
      bloodType: BloodType.AB_POSITIVE,
      allergies: 'Sulfa drugs',
      medicalHistory: 'Heart disease, High cholesterol',
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
      emergencyContact: 'Carlos Garcia',
      emergencyPhone: '+1234567899',
      bloodType: BloodType.O_NEGATIVE,
      allergies: 'None',
      medicalHistory: 'Depression, Anxiety',
    },
  ];

  for (const patientData of patients) {
    await prisma.patient.create({ data: patientData });
  }

  console.log(`✅ Created ${patients.length} patients`);
}

async function seedServiceCategories() {
  console.log('🏷️ Seeding service categories...');

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
  ];

  for (const categoryData of categories) {
    await prisma.serviceCategory.create({ data: categoryData });
  }

  console.log(`✅ Created ${categories.length} service categories`);
}

async function seedServices() {
  console.log('🔧 Seeding services...');

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

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
