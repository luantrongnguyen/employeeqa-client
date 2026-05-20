import 'dotenv/config'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
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

const SAMPLE_THREADS = [
  {
    tagNames: ['Lương & Phúc lợi'],
    status: 'answered' as const,
    question: 'Công ty có kế hoạch điều chỉnh lương theo lạm phát trong năm nay không? Mức lạm phát hiện tại khá cao và thu nhập thực tế của nhân viên đang bị ảnh hưởng đáng kể.',
    answer: 'Cảm ơn bạn đã đặt câu hỏi này. Ban lãnh đạo đã ghi nhận vấn đề và đang trong quá trình xem xét chính sách điều chỉnh lương hàng năm. Dự kiến trong quý 3 năm nay sẽ có thông báo chính thức về mức điều chỉnh, áp dụng cho toàn bộ nhân viên chính thức đã qua thử việc.',
  },
  {
    tagNames: ['Môi trường làm việc'],
    status: 'answered' as const,
    question: 'Phòng họp tầng 3 thường xuyên bị đặt kín cả ngày, nhân viên không có chỗ để tổ chức các buổi họp nhỏ. Có thể bổ sung thêm không gian họp không ạ?',
    answer: 'Phản hồi của bạn rất hữu ích. Chúng tôi đã ghi nhận tình trạng này và đang lên kế hoạch cải tạo khu vực pantry tầng 2 thành 2 phòng họp nhỏ (4–6 người). Dự kiến hoàn thành vào cuối quý này. Trong thời gian chờ đợi, các nhóm có thể đăng ký sử dụng khu vực lounge tầng 1.',
  },
  {
    tagNames: ['Chính sách công ty'],
    status: 'answered' as const,
    question: 'Chính sách làm việc từ xa (remote work) của công ty hiện tại như thế nào? Tôi thấy một số phòng ban được làm remote nhiều hơn trong khi bộ phận tôi bắt buộc phải có mặt mỗi ngày.',
    answer: 'Hiện tại chính sách remote work được áp dụng linh hoạt theo từng bộ phận tùy vào tính chất công việc. Ban HR đang soạn thảo chính sách thống nhất áp dụng toàn công ty, dự kiến ban hành vào đầu quý tới. Chính sách mới sẽ cho phép tối thiểu 2 ngày/tuần làm việc từ xa với các vị trí không yêu cầu hiện diện trực tiếp.',
  },
  {
    tagNames: ['Đào tạo & Phát triển'],
    status: 'answered' as const,
    question: 'Công ty có hỗ trợ chi phí học các khóa chứng chỉ chuyên môn không? Tôi muốn thi lấy chứng chỉ PMP nhưng học phí khá cao.',
    answer: 'Công ty có chính sách hỗ trợ học phí cho các chứng chỉ chuyên môn liên quan đến công việc. Cụ thể, nhân viên chính thức từ 1 năm trở lên được hỗ trợ tối đa 70% học phí, tối đa 10 triệu đồng/năm. Với chứng chỉ PMP, bạn có thể nộp đơn đề xuất qua phòng HR kèm theo thông tin khóa học và mức học phí. Sau khi hoàn thành và đạt chứng chỉ, phần còn lại sẽ được hoàn trả vào lương tháng tiếp theo.',
  },
  {
    tagNames: ['Nhân sự'],
    status: 'answered' as const,
    question: 'Quy trình đánh giá hiệu suất cuối năm diễn ra như thế nào? Tiêu chí đánh giá có được công bố trước không hay chỉ do quản lý trực tiếp quyết định?',
    answer: 'Quy trình đánh giá hiệu suất cuối năm gồm 3 bước: (1) Tự đánh giá — nhân viên tự chấm điểm theo KPI đã thiết lập từ đầu năm; (2) Đánh giá từ quản lý trực tiếp; (3) Hiệu chỉnh và xác nhận kết quả ở cấp phòng/ban. Bộ tiêu chí KPI được công bố và thống nhất với từng nhân viên ngay từ tháng 1 hàng năm. Nếu bạn chưa có KPI rõ ràng, hãy chủ động trao đổi với quản lý để thiết lập ngay.',
  },
  {
    tagNames: ['Kỹ thuật & IT'],
    status: 'answered' as const,
    question: 'Máy tính công ty cài Windows 10 đang rất chậm, đặc biệt khi mở nhiều ứng dụng cùng lúc. Phòng IT có kế hoạch nâng cấp phần cứng hoặc lên Windows 11 không?',
    answer: 'IT đã ghi nhận phản hồi về hiệu năng máy tính. Chúng tôi đang trong quá trình kiểm tra toàn bộ thiết bị và lên danh sách các máy cần nâng cấp RAM. Với máy tính trên 4 năm tuổi sẽ được ưu tiên thay thế trong kế hoạch mua sắm Q4. Bạn có thể liên hệ helpdesk (ext. 1234) để được hỗ trợ tối ưu máy hiện tại trong thời gian chờ.',
  },
  {
    tagNames: ['Quản lý'],
    status: 'answered' as const,
    question: 'Có cơ chế nào để nhân viên phản hồi về phong cách quản lý của cấp trên một cách ẩn danh không? Tôi nghĩ feedback 360 độ sẽ giúp cải thiện văn hóa làm việc rất nhiều.',
    answer: 'Cảm ơn bạn đã đề xuất rất xây dựng. Hiện tại chúng tôi đang triển khai thí điểm khảo sát 360 độ ẩn danh cho cấp quản lý tại 2 bộ phận. Nếu kết quả tích cực, chương trình sẽ được mở rộng toàn công ty vào đầu năm sau. Ngoài ra, kênh hỏi đáp ẩn danh này chính là một trong những công cụ để ban lãnh đạo lắng nghe phản hồi từ nhân viên. Chúng tôi đọc và xem xét nghiêm túc mọi câu hỏi.',
  },
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

  const threadCount = await prisma.questionThread.count()
  if (threadCount === 0) {
    const admin = await prisma.admin.findUnique({ where: { username: 'admin' } })
    const allTags = await prisma.tag.findMany()
    const tagByName = Object.fromEntries(allTags.map((t) => [t.nameVi, t]))

    for (const sample of SAMPLE_THREADS) {
      const accessToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const tagIds = sample.tagNames
        .map((name) => tagByName[name]?.id)
        .filter(Boolean) as string[]

      const thread = await prisma.questionThread.create({
        data: {
          accessToken,
          status: sample.status,
          expiresAt,
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
          messages: {
            create: [
              { senderType: 'employee', content: sample.question },
              ...(sample.answer && admin
                ? [{ senderType: 'admin' as const, adminId: admin.id, content: sample.answer }]
                : []),
            ],
          },
        },
      })

      // Create notification for the question
      const firstMsg = await prisma.message.findFirst({
        where: { threadId: thread.id, senderType: 'employee' },
      })
      if (firstMsg) {
        await prisma.notification.create({
          data: { threadId: thread.id, messageId: firstMsg.id, type: 'new_question' },
        })
      }
    }

    console.log(`✓ Created ${SAMPLE_THREADS.length} sample threads.`)
  } else {
    console.log('Threads already exist, skipping sample data.')
  }
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
