import { PrismaClient, Role, EmploymentStatus, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const departments = [
  { name: 'Engineering', description: 'Software development and technical operations' },
  { name: 'Human Resources', description: 'People operations and talent management' },
  { name: 'Marketing', description: 'Brand, growth, and communications' },
  { name: 'Finance', description: 'Financial planning and accounting' },
  { name: 'Operations', description: 'Business operations and logistics' },
];

const designations = {
  Engineering: ['Software Engineer', 'Senior Software Engineer', 'Tech Lead', 'DevOps Engineer', 'QA Engineer'],
  'Human Resources': ['HR Manager', 'HR Executive', 'Talent Acquisition Specialist', 'HR Coordinator'],
  Marketing: ['Marketing Manager', 'Content Writer', 'SEO Specialist', 'Social Media Manager'],
  Finance: ['Finance Manager', 'Accountant', 'Financial Analyst', 'Payroll Specialist'],
  Operations: ['Operations Manager', 'Business Analyst', 'Project Manager', 'Support Specialist'],
};

async function main() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('✅ Database already seeded, skipping...');
    return;
  }
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.document.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password@123', 12);

  // Create departments
  const createdDepts: { name: string; id: string }[] = [];
  for (const dept of departments) {
    const d = await prisma.department.create({ data: dept });
    createdDepts.push(d);
  }
  console.log(`✅ Created ${createdDepts.length} departments`);

  // Create Super Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hrms.com',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
      employee: {
        create: {
          employeeId: 'EMP0001',
          firstName: 'Super',
          lastName: 'Admin',
          designation: 'System Administrator',
          departmentId: createdDepts.find(d => d.name === 'Human Resources')!.id,
          salary: 150000,
          gender: Gender.MALE,
          status: EmploymentStatus.ACTIVE,
        },
      },
    },
    include: { employee: true },
  });
  console.log('✅ Created Super Admin');

  // Create 2 HR users
  const hrNames = [
    { firstName: 'Sarah', lastName: 'Johnson', email: 'hr1@hrms.com' },
    { firstName: 'Michael', lastName: 'Chen', email: 'hr2@hrms.com' },
  ];

  const hrUsers = [];
  for (let i = 0; i < hrNames.length; i++) {
    const { firstName, lastName, email } = hrNames[i];
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.HR,
        isEmailVerified: true,
        employee: {
          create: {
            employeeId: `EMP000${i + 2}`,
            firstName,
            lastName,
            designation: 'HR Manager',
            departmentId: createdDepts.find(d => d.name === 'Human Resources')!.id,
            salary: 90000,
            gender: i === 0 ? Gender.FEMALE : Gender.MALE,
            status: EmploymentStatus.ACTIVE,
          },
        },
      },
      include: { employee: true },
    });
    hrUsers.push(user);
  }
  console.log('✅ Created 2 HR users');

  // Create 30 employees
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Drew', 'Quinn', 'Jamie', 'Avery',
    'Blake', 'Cameron', 'Dakota', 'Emery', 'Finley', 'Hayden', 'Kendall', 'Logan', 'Mason', 'Noah',
    'Olivia', 'Parker', 'Reese', 'Sage', 'Tatum', 'Skyler', 'Rowan', 'Phoenix', 'River', 'Ash'];
  const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson',
    'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark',
    'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright'];

  const employeeUsers = [];
  for (let i = 0; i < 30; i++) {
    const dept = createdDepts[i % createdDepts.length];
    const deptDesignations = designations[dept.name as keyof typeof designations] || ['Employee'];
    const designation = deptDesignations[i % deptDesignations.length];
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const salary = 40000 + Math.floor(Math.random() * 80000);

    const user = await prisma.user.create({
      data: {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@hrms.com`,
        password: hashedPassword,
        role: Role.EMPLOYEE,
        isEmailVerified: true,
        employee: {
          create: {
            employeeId: `EMP${String(i + 4).padStart(4, '0')}`,
            firstName,
            lastName,
            designation,
            departmentId: dept.id,
            salary,
            gender: i % 3 === 0 ? Gender.FEMALE : i % 5 === 0 ? Gender.OTHER : Gender.MALE,
            status: i < 28 ? EmploymentStatus.ACTIVE : EmploymentStatus.PROBATION,
            joiningDate: new Date(Date.now() - Math.random() * 365 * 3 * 24 * 60 * 60 * 1000),
            phone: `+91${Math.floor(9000000000 + Math.random() * 999999999)}`,
            city: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'][i % 5],
            country: 'India',
          },
        },
      },
      include: { employee: true },
    });
    employeeUsers.push(user);
  }
  console.log('✅ Created 30 employees');

  // Set department heads
  await prisma.department.update({
    where: { id: createdDepts.find(d => d.name === 'Engineering')!.id },
    data: { headId: employeeUsers[0].employee!.id },
  });

  // Create attendance records for last 30 days
  const allEmployees = [adminUser, ...hrUsers, ...employeeUsers];
  let attendanceCount = 0;
  for (const user of allEmployees) {
    if (!user.employee) continue;
    for (let day = 30; day >= 1; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);

      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

      const isPresent = Math.random() > 0.1; // 90% attendance
      if (!isPresent) continue;

      const clockInHour = Math.random() > 0.2 ? 9 : 9 + Math.floor(Math.random() * 2);
      const clockIn = new Date(date);
      clockIn.setHours(clockInHour, Math.floor(Math.random() * 60));

      const clockOut = new Date(clockIn);
      clockOut.setHours(clockInHour + 8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));

      const workingHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

      await prisma.attendance.create({
        data: {
          employeeId: user.employee.id,
          date,
          clockIn,
          clockOut,
          workingHours,
          overtime: Math.max(0, workingHours - 8),
          isLate: clockInHour > 9,
          status: 'PRESENT',
        },
      });
      attendanceCount++;
    }
  }
  console.log(`✅ Created ${attendanceCount} attendance records`);

  // Create leave balances for current year
  const currentYear = new Date().getFullYear();
  const leaveTypes = ['SICK', 'CASUAL', 'PAID', 'WORK_FROM_HOME'];
  const leaveDefaults: Record<string, number> = { SICK: 10, CASUAL: 12, PAID: 15, WORK_FROM_HOME: 24 };

  for (const user of allEmployees) {
    if (!user.employee) continue;
    for (const lt of leaveTypes) {
      const total = leaveDefaults[lt];
      const used = Math.floor(Math.random() * 5);
      await prisma.leaveBalance.create({
        data: {
          employeeId: user.employee.id,
          leaveType: lt as never,
          year: currentYear,
          total,
          used,
          remaining: total - used,
        },
      });
    }
  }
  console.log('✅ Created leave balances');

  // Create some leave requests
  for (let i = 0; i < 20; i++) {
    const employee = employeeUsers[Math.floor(Math.random() * employeeUsers.length)];
    if (!employee.employee) continue;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) - 10);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3));

    await prisma.leaveRequest.create({
      data: {
        employeeId: employee.employee.id,
        leaveType: leaveTypes[Math.floor(Math.random() * leaveTypes.length)] as never,
        startDate,
        endDate,
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        reason: 'Personal reasons requiring time off.',
        status: ['PENDING', 'APPROVED', 'REJECTED'][Math.floor(Math.random() * 3)] as never,
      },
    });
  }
  console.log('✅ Created leave requests');

  // Create payroll records
  for (const user of allEmployees.slice(0, 10)) {
    if (!user.employee) continue;
    for (let m = 1; m <= 6; m++) {
      const salary = Number(user.employee.salary);
      const netSalary = salary * 0.85; // After tax/deductions
      await prisma.payroll.create({
        data: {
          employeeId: user.employee.id,
          month: m,
          year: currentYear,
          basicSalary: salary,
          tax: salary * 0.1,
          deductions: salary * 0.05,
          netSalary,
          workingDays: 22,
          presentDays: 20 + Math.floor(Math.random() * 2),
          status: 'PAID',
          paidAt: new Date(currentYear, m, 1),
        },
      });
    }
  }
  console.log('✅ Created payroll records');

  // Create announcements
  const announcements = [
    { title: 'Q2 All-Hands Meeting', content: 'Join us for our quarterly all-hands meeting to review progress and discuss goals for the next quarter. All employees are required to attend.', isPinned: true },
    { title: 'New Leave Policy Update', content: 'We have updated our leave policy effective from next month. Please review the updated policy document in the HR portal.', isPinned: false },
    { title: 'Office Diwali Celebration', content: 'We will be celebrating Diwali in the office on October 24th. There will be special activities, food, and prizes!', isPinned: false },
    { title: 'Performance Review Season', content: 'Annual performance reviews are now open. Managers should complete reviews for their team members by end of the month.', isPinned: true },
    { title: 'New Health Insurance Benefits', content: 'We have enhanced our health insurance plan with additional coverage. Details have been emailed to all employees.', isPinned: false },
  ];

  for (const ann of announcements) {
    await prisma.announcement.create({
      data: { ...ann, createdById: adminUser.id },
    });
  }
  console.log('✅ Created announcements');

  // Create performance reviews
  for (let i = 0; i < 10; i++) {
    const reviewee = employeeUsers[i];
    const reviewer = hrUsers[0];
    if (!reviewee.employee || !reviewer.employee) continue;

    await prisma.performanceReview.create({
      data: {
        employeeId: reviewee.employee.id,
        reviewerId: reviewer.employee.id,
        period: 'H1',
        year: currentYear,
        rating: 3 + Math.random() * 2,
        feedback: 'Employee has shown consistent performance and meets expectations. Good team player.',
        strengths: 'Technical skills, communication, teamwork',
        improvements: 'Time management, documentation',
        promotionRecommended: Math.random() > 0.7,
      },
    });
  }
  console.log('✅ Created performance reviews');

  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Test Credentials:');
  console.log('Super Admin: admin@hrms.com / Password@123');
  console.log('HR Manager: hr1@hrms.com / Password@123');
  console.log('Employee: alex.smith@hrms.com / Password@123');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
