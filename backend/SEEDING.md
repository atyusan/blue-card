# 🌱 Database Seeding Guide

This guide explains how to use the database seeders to populate your Hospital Billing System with sample data.

## 📋 What Gets Seeded

The seeder creates comprehensive sample data for all major entities:

### 👥 **Users & Staff**
- **Admin User**: `admin@hospital.com` / `admin123`
- **Doctors**: Cardiologist, Orthopedic Surgeon
- **Nurse**: Emergency Care Specialist
- **Cashier**: Finance Department
- **Pharmacist**: Clinical Pharmacy
- **Lab Technician**: Medical Technology

### 🏥 **Patients**
- 5 sample patients with realistic medical histories
- Various demographics, blood types, and allergies
- Emergency contact information

### 🏷️ **Service Categories**
- Consultation, Laboratory, Radiology
- Surgery, Pharmacy, Emergency
- Inpatient, Rehabilitation

### 🔧 **Services**
- **Consultations**: General, Specialist, Emergency
- **Laboratory**: CBC, Blood Glucose, Urinalysis
- **Radiology**: Chest X-Ray, CT Scan
- **Surgery**: Appendectomy, Hernia Repair
- **Pharmacy**: Prescription Medication
- **Inpatient**: Daily ward charges

### 🏥 **Wards & Beds**
- **General Wards**: 40 beds total
- **Private Ward**: 10 beds
- **ICU Unit**: 8 beds
- **Maternity Ward**: 15 beds
- **Pediatric Ward**: 12 beds

### 📊 **Sample Data**
- Admissions with realistic dates and statuses
- Consultations with symptoms and diagnoses
- Lab orders and prescriptions
- Surgeries with operating room assignments
- Invoices with charges and payments
- Cash transactions and petty cash requests

## 🚀 How to Run

### **Prerequisites**
1. Ensure your database is running
2. Run Prisma migrations: `npx prisma migrate dev`
3. Generate Prisma client: `npx prisma generate`

### **Seed the Database**
```bash
# Run the seeder
npm run seed

# Or with ts-node directly
npx ts-node prisma/seed.ts
```

### **Reset and Reseed**
```bash
# Clear database and reseed
npm run seed:reset
```

## 🔑 **Default Login Credentials**

After seeding, you can use these accounts to test the system:

| Role | Email | Username | Password |
|------|-------|----------|----------|
| **Admin** | `admin@hospital.com` | `admin` | `admin123` |
| **Doctor** | `doctor.smith@hospital.com` | `dr.smith` | `doctor123` |
| **Nurse** | `nurse.wilson@hospital.com` | `nurse.wilson` | `nurse123` |
| **Cashier** | `cashier.brown@hospital.com` | `cashier.brown` | `cashier123` |
| **Pharmacist** | `pharmacist.davis@hospital.com` | `pharmacist.davis` | `pharmacist123` |
| **Lab Tech** | `lab.tech@hospital.com` | `lab.tech` | `lab123` |

## 📊 **Sample Data Statistics**

After seeding, your database will contain:
- **7 Users** (different roles)
- **7 Staff Members** (various departments)
- **5 Patients** (with medical histories)
- **8 Service Categories**
- **15 Services** (with pricing)
- **6 Wards** (85 total beds)
- **3 Admissions** (mix of active/discharged)
- **3 Consultations** (completed)
- **2 Lab Orders** (completed)
- **2 Prescriptions** (active)
- **2 Surgeries** (completed)
- **3 Invoices** (with charges)
- **3 Payments** (partial payments)
- **2 Cash Transactions**
- **1 Petty Cash Request**

## 🧪 **Testing the System**

### **1. Start the Application**
```bash
npm run start:dev
```

### **2. Access Swagger UI**
Navigate to: `http://localhost:3000/api/v1/docs`

### **3. Test Authentication**
1. Use the login endpoint with any seeded user credentials
2. Copy the JWT token from the response
3. Use the token in the "Authorize" button in Swagger UI

### **4. Test Endpoints**
- **Patients**: View, search, and manage patient records
- **Services**: Browse service catalog and pricing
- **Billing**: Create invoices and process payments
- **Admissions**: Manage patient admissions and ward assignments
- **Consultations**: View doctor consultations
- **Reports**: Generate financial and operational reports

## 🔄 **Customizing the Seeder**

### **Add More Data**
Edit `prisma/seed.ts` to add more sample data:

```typescript
// Add more patients
const additionalPatients = [
  {
    patientId: 'P006',
    firstName: 'Frank',
    lastName: 'Anderson',
    // ... other fields
  }
];

// Add more services
const additionalServices = [
  {
    name: 'MRI Scan',
    description: 'Magnetic Resonance Imaging',
    // ... other fields
  }
];
```

### **Modify Existing Data**
Change the sample data in the seeder functions:

```typescript
// Modify user passwords
password: await bcrypt.hash('your-custom-password', 10),

// Change service prices
basePrice: 75.00,
currentPrice: 75.00,
```

## 🚨 **Important Notes**

1. **Database Reset**: The seeder clears all existing data before seeding
2. **Dependencies**: Data is seeded in the correct order to maintain referential integrity
3. **Realistic Data**: All sample data is realistic but fictional
4. **Production**: Never run seeders in production environments
5. **Backup**: Always backup your database before running seeders

## 🆘 **Troubleshooting**

### **Common Issues**

1. **Prisma Client Not Generated**
   ```bash
   npx prisma generate
   ```

2. **Database Connection Issues**
   - Check your `.env` file
   - Ensure database is running
   - Verify connection string

3. **Permission Errors**
   - Ensure database user has CREATE/DELETE permissions
   - Check database schema ownership

4. **TypeScript Errors**
   ```bash
   npm run build
   ```

### **Reset Everything**
```bash
# Drop and recreate database
npx prisma migrate reset

# Regenerate client
npx prisma generate

# Run seeder
npm run seed
```

## 📚 **Next Steps**

After seeding:
1. **Test the API endpoints** using Swagger UI
2. **Explore the data** using Prisma Studio: `npx prisma studio`
3. **Build the frontend** to interact with the seeded data
4. **Customize the system** for your specific needs

---

**🎉 Happy Seeding! Your Hospital Billing System is now ready for testing and development.**
