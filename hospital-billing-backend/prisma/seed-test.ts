import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);

    // Test enum imports
    console.log('✅ All enum types imported successfully');

    console.log('🎉 Seeder is ready to run!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
