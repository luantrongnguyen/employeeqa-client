import 'dotenv/config'
import bcrypt from 'bcrypt'
import prisma from './prisma'

async function seed() {
  const existing = await prisma.admin.findUnique({ where: { username: 'admin' } })
  if (existing) {
    console.log('Admin account already exists, skipping seed.')
    return
  }

  const passwordHash = await bcrypt.hash('Admin@123', 12)
  await prisma.admin.create({
    data: {
      username: 'admin',
      passwordHash,
      displayName: 'Administrator',
    },
  })

  console.log('✓ Admin account created: username=admin, password=Admin@123')
  console.log('  → Please change the password after first login.')
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
