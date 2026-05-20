import 'dotenv/config'
import bcrypt from 'bcrypt'
import prisma from './prisma'

const DEFAULT_TAGS = [
  { nameVi: 'Nhân sự', nameEn: 'Human Resources', color: '#3B82F6' },
  { nameVi: 'Lương & Phúc lợi', nameEn: 'Salary & Benefits', color: '#10B981' },
  { nameVi: 'Môi trường làm việc', nameEn: 'Work Environment', color: '#F59E0B' },
  { nameVi: 'Chính sách công ty', nameEn: 'Company Policy', color: '#8B5CF6' },
  { nameVi: 'Đào tạo & Phát triển', nameEn: 'Training & Development', color: '#EC4899' },
  { nameVi: 'Kỹ thuật & IT', nameEn: 'Technical & IT', color: '#06B6D4' },
  { nameVi: 'Quản lý', nameEn: 'Management', color: '#EF4444' },
  { nameVi: 'Khác', nameEn: 'Other', color: '#6B7280' },
]

async function seed() {
  const existing = await prisma.admin.findUnique({ where: { username: 'admin' } })
  if (existing) {
    console.log('Admin account already exists, skipping seed.')
  } else {
    const passwordHash = await bcrypt.hash('Admin@123', 12)
    await prisma.admin.create({
      data: { username: 'admin', passwordHash, displayName: 'Administrator' },
    })
    console.log('✓ Admin account created: username=admin, password=Admin@123')
  }

  const tagCount = await prisma.tag.count()
  if (tagCount === 0) {
    await prisma.tag.createMany({ data: DEFAULT_TAGS })
    console.log(`✓ Created ${DEFAULT_TAGS.length} default tags.`)
  } else {
    console.log('Tags already exist, skipping.')
  }
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
