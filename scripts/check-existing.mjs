import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const managers = await prisma.manager.findMany({ include: { user: true } });
const users = await prisma.user.findMany();
console.log('MANAGERS:', JSON.stringify(managers, null, 2));
console.log('USERS:', JSON.stringify(users.map(u => ({ id: u.id, email: u.email, fullName: u.fullName, role: u.role })), null, 2));
await prisma.$disconnect();
