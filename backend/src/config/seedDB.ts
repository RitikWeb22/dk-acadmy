import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';

export const seedInitialDatabase = async (): Promise<void> => {
  try {
    // 1. Seed Production Super Admin (ritikweb30@gmail.com)
    let superAdmin = await User.findOne({ email: 'ritikweb30@gmail.com' });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Ritik (Super Admin)',
        email: 'ritikweb30@gmail.com',
        password: 'ritik@123',
        phone: '+91 98765 43210',
        role: 'SUPER_ADMIN',
        targetExam: 'JEE Advanced'
      });
      console.log('[Seed] Super Admin created: ritikweb30@gmail.com');
    } else {
      superAdmin.password = 'ritik@123';
      superAdmin.role = 'SUPER_ADMIN';
      await superAdmin.save();
    }

    // Clean up older demo & test dummy accounts from database
    await User.deleteMany({
      $or: [
        { email: { $in: ['teacher@dkacademy.com', 'director@dkacademy.com', 'admin@dkacademy.com', 'test@test.com'] } },
        { email: { $regex: /^test[\._]/i } }
      ]
    });

    // 2. Seed Default Courses if collection is empty
    const coursesCount = await Course.countDocuments();
    if (coursesCount === 0) {
      const defaultCourses = [
        {
          title: '2-Year Ultimate JEE Main & Advanced Mastery Program',
          slug: 'jee-main-advanced-2yr-ultimate',
          description: 'Comprehensive 2-year classroom coaching program covering entire Class 11th & 12th syllabus with Kota pedagogy and DK Sir 20s speed techniques.',
          category: 'JEE Main & Advanced',
          targetClass: 'Class 11th',
          targetYear: 'Target JEE 2028',
          price: 78000,
          originalPrice: 95000,
          deliveryMode: 'Online Live',
          startDate: '28th May 2026',
          duration: '2-Year Full Program',
          coverImage: '/img/dk-results-banner.jpeg',
          features: [
            'DK Sir 20-30s Speed Solving Algorithms',
            'Live Audio Doubt Counter 6 Days/Week',
            'Printed Kota Theory Modules & Daily DPPs',
            'NTA CBT Simulation Mock Test Series'
          ],
          isPublished: true,
          curriculumSections: [
            {
              id: 'sec-1',
              title: 'Chapter 1: Foundations & Calculus Inspection',
              lectures: [
                {
                  id: 'lec-1',
                  title: 'Introduction to 20s Inspection Method',
                  duration: '38:40',
                  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                  isFreePreview: true,
                  notesPdfUrl: '/downloads/dk-calculus-handout-01.pdf',
                  dppPdfUrl: '/downloads/dpp-calculus-01.pdf'
                },
                {
                  id: 'lec-2',
                  title: 'King’s Property & Symmetric Integrals',
                  duration: '45:15',
                  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                  isFreePreview: true,
                  notesPdfUrl: '/downloads/kings-property-notes.pdf',
                  dppPdfUrl: '/downloads/dpp-calculus-02.pdf'
                }
              ]
            }
          ]
        },
        {
          title: 'DK Sir Chapter-wise Math PYQ Video Vault & Short Tricks',
          slug: 'math-pyq-vault-short-tricks',
          description: '15+ Years Chapter-wise solved PYQ video vault with step-by-step 20-30s speed inspection algorithms for Class 11th & 12th.',
          category: 'JEE Advanced',
          targetClass: 'Class 12th',
          targetYear: 'Target JEE 2027',
          price: 8999,
          originalPrice: 14500,
          deliveryMode: 'Hybrid',
          startDate: 'Immediate Access',
          duration: '1-Year Full Access',
          coverImage: '/img/logo.jpeg',
          features: [
            '1000+ Past JEE Advanced Questions Solved',
            'Zero Multi-step Calculations Method',
            'Handwritten Kota Pedagogy Notes PDF',
            'Chapter-wise Daily Practice Problem Sets'
          ],
          isPublished: true,
          curriculumSections: []
        },
        {
          title: 'BITSAT Speed, Accuracy & Logic Mastery Crash Program',
          slug: 'bitsat-speed-accuracy-crash-program',
          description: 'Specialized 130-question CBT mock testing series with speed algebra and logical reasoning tricks for BITS Pilani aspirants.',
          category: 'BITSAT',
          targetClass: 'Class 12th / Dropper',
          targetYear: 'Target BITSAT 2026',
          price: 12000,
          originalPrice: 18500,
          deliveryMode: 'Online Live',
          startDate: '15th June 2026',
          duration: '4-Month Sprint',
          coverImage: '/img/dk-results-banner.jpeg',
          features: [
            '20 Full Syllabus BITSAT CBT Mocks',
            'Speed Mathematics 45-second Solving Keys',
            'English Proficiency & Logical Reasoning Modules'
          ],
          isPublished: true,
          curriculumSections: []
        }
      ];

      await Course.insertMany(defaultCourses);
      console.log(`[Seed] Seeded ${defaultCourses.length} default courses into MongoDB successfully!`);
    }

    // 3. Seed Initial Verified Fee Orders & Invoices if collection is empty
    const ordersCount = await Order.countDocuments();
    if (ordersCount === 0) {
      const initialOrders = [
        {
          orderId: 'order_rzp_101',
          paymentId: 'pay_rzp_live_09842',
          studentName: 'Aarav Sharma',
          studentEmail: 'aarav.sharma@jee2026.in',
          studentPhone: '+91 98112 34567',
          courseId: 'jee-main-advanced-2yr-ultimate',
          courseTitle: '2-Year Ultimate JEE Main & Advanced Mastery Program',
          amount: 78000,
          currency: 'INR',
          status: 'SUCCESS',
          paymentGateway: 'Razorpay',
          notes: {
            invoiceNo: 'INV-2026-0842',
            rollNo: 'STD-2028-042',
            centerType: 'Janakpuri HQ',
            paymentChannel: 'Razorpay'
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          orderId: 'order_rzp_102',
          paymentId: 'pay_rzp_live_09841',
          studentName: 'Priya Iyer',
          studentEmail: 'priya.iyer@jee2026.in',
          studentPhone: '+91 98223 45678',
          courseId: 'math-pyq-vault-short-tricks',
          courseTitle: 'DK Sir Chapter-wise Math PYQ Video Vault & Short Tricks',
          amount: 8999,
          currency: 'INR',
          status: 'SUCCESS',
          paymentGateway: 'Razorpay',
          notes: {
            invoiceNo: 'INV-2026-0841',
            rollNo: 'STD-2028-041',
            centerType: 'Online LMS',
            paymentChannel: 'Razorpay'
          },
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
        },
        {
          orderId: 'order_desk_103',
          paymentId: 'pay_cash_desk_0840',
          studentName: 'Rohan Deshmukh',
          studentEmail: 'rohan.deshmukh@jee2026.in',
          studentPhone: '+91 98334 56789',
          courseId: 'jee-main-advanced-2yr-ultimate',
          courseTitle: 'Class 11 & 12 2-Year Live Classroom',
          amount: 48000,
          currency: 'INR',
          status: 'SUCCESS',
          paymentGateway: 'Direct',
          notes: {
            invoiceNo: 'INV-2026-0840',
            rollNo: 'STD-2028-040',
            centerType: 'Janakpuri HQ',
            paymentChannel: 'Cash Desk'
          },
          createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000)
        },
        {
          orderId: 'order_rzp_104',
          paymentId: 'pay_rzp_live_09839',
          studentName: 'Aditya Verma',
          studentEmail: 'aditya.verma@jee2026.in',
          studentPhone: '+91 98445 67890',
          courseId: 'bitsat-speed-accuracy-crash-program',
          courseTitle: 'BITSAT Speed, Accuracy & Logic Mastery Crash Program',
          amount: 12000,
          currency: 'INR',
          status: 'SUCCESS',
          paymentGateway: 'Razorpay',
          notes: {
            invoiceNo: 'INV-2026-0839',
            rollNo: 'STD-2028-039',
            centerType: 'Online LMS',
            paymentChannel: 'Razorpay'
          },
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          orderId: 'order_rzp_105',
          paymentId: 'pay_rzp_live_09838',
          studentName: 'Ananya Kashyap',
          studentEmail: 'ananya.kashyap@jee2026.in',
          studentPhone: '+91 98556 78901',
          courseId: 'general',
          courseTitle: 'Self-Study DLP + All India CBT Series',
          amount: 18000,
          currency: 'INR',
          status: 'SUCCESS',
          paymentGateway: 'Razorpay',
          notes: {
            invoiceNo: 'INV-2026-0838',
            rollNo: 'STD-2028-038',
            centerType: 'Online LMS',
            paymentChannel: 'Razorpay'
          },
          createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000)
        },
        {
          orderId: 'order_desk_106',
          paymentId: 'pay_upi_desk_0837',
          studentName: 'Kabir Nair',
          studentEmail: 'kabir.nair@jee2026.in',
          studentPhone: '+91 98667 89012',
          courseId: 'general',
          courseTitle: 'Online CBT Test Series (Class 11 & 12)',
          amount: 2999,
          currency: 'INR',
          status: 'SUCCESS',
          paymentGateway: 'Direct',
          notes: {
            invoiceNo: 'INV-2026-0837',
            rollNo: 'STD-2028-037',
            centerType: 'Janakpuri HQ',
            paymentChannel: 'UPI QR'
          },
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
        }
      ];

      await Order.insertMany(initialOrders);
      console.log(`[Seed] Seeded ${initialOrders.length} verified fee orders & tax invoices into MongoDB successfully!`);
    }
  } catch (error: any) {
    console.error('[Seed Error]:', error.message);
  }
};
