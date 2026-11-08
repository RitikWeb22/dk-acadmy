import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
export const seedInitialDatabase = async () => {
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
        }
        else {
            superAdmin.password = 'ritik@123';
            superAdmin.role = 'SUPER_ADMIN';
            await superAdmin.save();
        }
        // 1b. Seed Dharmendra Kumar (DK Sir) Super Admin
        let dkSir = await User.findOne({ email: 'dharmendra@dkacademy.com' });
        if (!dkSir) {
            dkSir = await User.create({
                name: 'Dharmendra Kumar (DK Sir)',
                email: 'dharmendra@dkacademy.com',
                password: 'admin123',
                phone: '+91 93259 87875',
                role: 'SUPER_ADMIN',
                targetExam: 'JEE Advanced'
            });
            console.log('[Seed] Dharmendra Kumar (DK Sir) Super Admin created: dharmendra@dkacademy.com');
        }
        else {
            dkSir.password = 'admin123';
            dkSir.role = 'SUPER_ADMIN';
            await dkSir.save();
        }
        // 1c. Seed Teacher Faculty Account
        let teacher = await User.findOne({ email: 'teacher@dkacademy.com' });
        if (!teacher) {
            teacher = await User.create({
                name: 'Senior Faculty (Mathematics)',
                email: 'teacher@dkacademy.com',
                password: 'teacher123',
                phone: '+91 98765 12345',
                role: 'TEACHER',
                targetExam: 'JEE Main & Advanced'
            });
            console.log('[Seed] Senior Faculty created: teacher@dkacademy.com');
        }
        else {
            teacher.password = 'teacher123';
            teacher.role = 'TEACHER';
            await teacher.save();
        }
        // Clean up older demo & test dummy accounts from database
        await User.deleteMany({
            $or: [
                { email: { $in: ['test@test.com'] } },
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
                            title: 'Chapter 1: Straight Lines & Coordinate Geometry (DK Sir Inspection Method)',
                            lectures: [
                                {
                                    id: 'lec-1',
                                    title: 'Straight Lines: 20-30s Inspection Technique for JEE Main & Advanced',
                                    duration: '42:10',
                                    videoUrl: '/videos/1.mp4',
                                    isFreePreview: true,
                                    notesPdfUrl: '/assets/downloads/st line-2.pdf',
                                    dppPdfUrl: '/assets/downloads/st line-2.pdf'
                                },
                                {
                                    id: 'lec-2',
                                    title: 'Conic Sections: Parabola Locus & Tangent Equations Masterclass',
                                    duration: '48:35',
                                    videoUrl: '/videos/2.mp4',
                                    isFreePreview: true,
                                    notesPdfUrl: '/assets/downloads/parabola -1.pdf',
                                    dppPdfUrl: '/assets/downloads/parabola -1.pdf'
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
                },
                {
                    title: 'DK Sir Masterclass: Straight Lines & Parabola Conic Sections (PYQs + Shortcuts)',
                    slug: 'dk-sir-straight-lines-parabola-masterclass',
                    description: "Complete high-yield masterclass covering Straight Lines and Parabola Conic Sections for JEE Main & Advanced. Learn DK Sir's signature 20-30 second inspection shortcuts to solve complex coordinate geometry questions without lengthy calculations.",
                    category: 'JEE Main & Advanced',
                    targetClass: 'Class 11th & 12th',
                    targetYear: 'Target JEE 2026-2027',
                    price: 1499,
                    originalPrice: 2999,
                    deliveryMode: 'Hybrid',
                    startDate: 'Immediate Access',
                    duration: 'Self-Paced + Live Doubt Counter',
                    coverImage: '/images/pyq-straight-lines-banner.jpg',
                    features: [
                        'DK Sir 20-30s Coordinate Geometry Shortcuts',
                        'Full High-Definition Video Masterclasses (Lectures 1 & 2)',
                        'Straight Lines 15-Year Solved PYQ Handout PDF',
                        'Parabola Conic Sections High-Yield Practice Sheet PDF',
                        'Live Audio Doubt Support & CBT Test Integration'
                    ],
                    curriculumSections: [
                        {
                            id: 'sec-1',
                            title: 'Module 1: Straight Lines 20-30s Inspection & PYQs',
                            lectures: [
                                {
                                    id: 'lec-sl-1',
                                    title: 'Straight Lines — Part 1: Slope, Intercept & 20s Inspection Shortcut',
                                    duration: '42:10',
                                    videoUrl: '/videos/1.mp4',
                                    isFreePreview: true,
                                    notesPdfUrl: '/assets/downloads/st line-2.pdf',
                                    dppPdfUrl: '/assets/downloads/st line-2.pdf'
                                }
                            ]
                        },
                        {
                            id: 'sec-2',
                            title: 'Module 2: Parabola Conic Sections & Exam Problem Solving',
                            lectures: [
                                {
                                    id: 'lec-pb-1',
                                    title: 'Parabola — Part 2: Standard Forms, Focal Chords & JEE Problem Solving',
                                    duration: '48:35',
                                    videoUrl: '/videos/2.mp4',
                                    isFreePreview: true,
                                    notesPdfUrl: '/assets/downloads/parabola -1.pdf',
                                    dppPdfUrl: '/assets/downloads/parabola -1.pdf'
                                }
                            ]
                        }
                    ],
                    isPublished: true
                }
            ];
            await Course.insertMany(defaultCourses);
            console.log(`[Seed] Seeded ${defaultCourses.length} default courses into MongoDB successfully!`);
        }
        // 3. Clean up older seed demo/dummy invoices from database so deleted orders never reappear
        await Order.deleteMany({
            $or: [
                { orderId: { $in: ['order_rzp_101', 'order_rzp_102', 'order_desk_103', 'order_rzp_104', 'order_rzp_105', 'order_desk_106'] } },
                { 'notes.invoiceNo': { $in: ['INV-2026-0842', 'INV-2026-0841', 'INV-2026-0840', 'INV-2026-0839', 'INV-2026-0838', 'INV-2026-0837'] } }
            ]
        });
    }
    catch (error) {
        console.error('[Seed Error]:', error.message);
    }
};
