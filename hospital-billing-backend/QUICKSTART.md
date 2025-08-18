# 🚀 Quick Start Guide - Hospital Billing System

Get your Hospital Billing System up and running in minutes!

## ⚡ **5-Minute Setup**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Set Up Database**
```bash
# Create and run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### **3. Test Database Connection**
```bash
# Verify database connection
npm run seed:test
```

### **4. Seed Sample Data**
```bash
# Populate database with sample data
npm run seed
```

### **5. Start the Application**
```bash
# Start development server
npm run start:dev
```

### **6. Access the System**
- **API**: `http://localhost:3000/api/v1`
- **Swagger Docs**: `http://localhost:3000/api/v1/docs`
- **Health Check**: `http://localhost:3000/api/v1/health`

## 🔑 **Default Login Credentials**

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@hospital.com` | `admin123` |
| **Doctor** | `doctor.smith@hospital.com` | `doctor123` |
| **Cashier** | `cashier.brown@hospital.com` | `cashier123` |

## 🧪 **Test the System**

### **1. Login to Get JWT Token**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123"
  }'
```

### **2. Use JWT Token**
Copy the token from the response and use it in the Swagger UI "Authorize" button.

### **3. Explore Endpoints**
- **Patients**: `/api/v1/patients`
- **Services**: `/api/v1/services`
- **Billing**: `/api/v1/billing`
- **Reports**: `/api/v1/reporting`

## 📊 **What You Get**

After seeding, your system includes:
- **7 Users** (Admin, Doctors, Nurses, Cashiers, etc.)
- **5 Patients** (with medical histories)
- **15 Services** (Consultations, Lab Tests, Surgery, etc.)
- **6 Wards** (85 total beds)
- **Sample Data** (Admissions, Consultations, Invoices, Payments)

## 🆘 **Troubleshooting**

### **Database Connection Issues**
```bash
# Check .env file
cat .env

# Test connection
npm run seed:test

# Reset database
npx prisma migrate reset
```

### **Build Issues**
```bash
# Clean and rebuild
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### **Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

## 🔄 **Reset Everything**
```bash
# Clear database and reseed
npm run seed:reset

# Or completely reset
npx prisma migrate reset
npm run seed
```

## 📚 **Next Steps**

1. **Explore the API** using Swagger UI
2. **Test all endpoints** with sample data
3. **Build the frontend** to interact with the system
4. **Customize** for your specific needs

---

**🎉 You're all set! Your Hospital Billing System is ready to use.**
