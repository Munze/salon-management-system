import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create default salon if it doesn't exist
  const salon = await prisma.salon.upsert({
    where: {
      id: 'default-salon'
    },
    update: {},
    create: {
      name: 'Beauty Salon',
      address: 'Main Street 123',
      phone: '+381 11 123 4567'
    }
  });

  console.log('Salon created:', salon);

  // Hash the password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@mail.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      name: 'Admin',
      salonId: salon.id
    }
  });

  console.log('Admin user created:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
