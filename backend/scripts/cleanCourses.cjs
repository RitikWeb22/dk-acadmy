const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://ritikweb30_db_user:LcIQJeKuxVDp0Q8g@cluster0.bpriw9o.mongodb.net/dk_academy_jee?appName=Cluster0';

async function cleanCourses() {
  console.log('[Maintenance] Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  const collection = mongoose.connection.db.collection('courses');

  // 1. Remove dummy course 'jee-2028-dropper-rapid-revision' and any course containing test or dummy
  const delResult = await collection.deleteMany({
    $or: [
      { slug: 'jee-2028-dropper-rapid-revision' },
      { title: { $regex: /dummy|sample|test/i } },
      { description: { $regex: /BigBuckBunny|ElephantsDream/i } }
    ]
  });
  console.log(`[Maintenance] Deleted ${delResult.deletedCount} dummy/test course(s).`);

  // 2. Clean 'jee-main-advanced-2yr-ultimate' to use real DK Sir videos and notes instead of BigBuckBunny
  await collection.updateOne(
    { slug: 'jee-main-advanced-2yr-ultimate' },
    {
      $set: {
        coverImage: '/images/pyq-straight-lines-banner.jpg',
        curriculumSections: [
          {
            id: 'sec-straight-lines-foundations',
            title: 'Chapter 1: Straight Lines & Coordinate Geometry (DK Sir Inspection Method)',
            sortOrder: 1,
            lectures: [
              {
                id: 'lec-st-1',
                title: 'Straight Lines: 20-30s Inspection Technique for JEE Main & Advanced',
                duration: '42:10',
                videoUrl: '/videos/1.mp4',
                isFreePreview: true,
                lessonType: 'recorded_video',
                notesPdfUrl: '/assets/downloads/st line-2.pdf',
                dppPdfUrl: '/assets/downloads/st line-2.pdf',
                sortOrder: 1
              },
              {
                id: 'lec-st-2',
                title: 'Conic Sections: Parabola Locus & Tangent Equations Masterclass',
                duration: '48:35',
                videoUrl: '/videos/2.mp4',
                isFreePreview: true,
                lessonType: 'recorded_video',
                notesPdfUrl: '/assets/downloads/parabola -1.pdf',
                dppPdfUrl: '/assets/downloads/parabola -1.pdf',
                sortOrder: 2
              }
            ]
          }
        ]
      }
    }
  );
  console.log('[Maintenance] Updated 2-Year Ultimate Course with authentic media.');

  // 3. Upsert official DK Sir Straight Lines & Parabola Conic Sections course
  await collection.updateOne(
    { slug: 'dk-sir-straight-lines-parabola-masterclass' },
    {
      $set: {
        title: 'DK Sir Masterclass: Straight Lines & Parabola Conic Sections (PYQs + Shortcuts)',
        slug: 'dk-sir-straight-lines-parabola-masterclass',
        shortDescription:
          "Master Straight Lines and Parabola for JEE Main & Advanced with DK Sir's 20-30s speed inspection algorithms, handwritten Kota notes, and 15-year PYQ solutions.",
        description:
          "Complete high-yield masterclass covering Straight Lines and Parabola Conic Sections for JEE Main & Advanced. Learn DK Sir's signature 20-30 second inspection shortcuts to solve complex coordinate geometry questions without lengthy calculations.",
        category: 'JEE Main & Advanced',
        targetClass: 'Class 11th & 12th',
        targetYear: 'Target JEE 2026-2027',
        targetExam: 'JEE Main & Advanced',
        instructor: 'DK Sir (Dharmendra Kumar)',
        price: 1499,
        originalPrice: 2999,
        deliveryMode: 'Hybrid',
        duration: 'Self-Paced + Live Doubt Counter',
        coverImage: '/images/pyq-straight-lines-banner.jpg',
        bannerImage: '/images/pyq-straight-lines-banner.jpg',
        syllabusPdfUrl: '/assets/downloads/st line-2.pdf',
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
            sortOrder: 1,
            lectures: [
              {
                id: 'lec-sl-1',
                title: 'Straight Lines — Part 1: Slope, Intercept & 20s Inspection Shortcut',
                duration: '42:10',
                videoUrl: '/videos/1.mp4',
                isFreePreview: true,
                lessonType: 'recorded_video',
                notesPdfUrl: '/assets/downloads/st line-2.pdf',
                dppPdfUrl: '/assets/downloads/st line-2.pdf',
                sortOrder: 1
              }
            ]
          },
          {
            id: 'sec-2',
            title: 'Module 2: Parabola Conic Sections & Exam Problem Solving',
            sortOrder: 2,
            lectures: [
              {
                id: 'lec-pb-1',
                title: 'Parabola — Part 2: Standard Forms, Focal Chords & JEE Problem Solving',
                duration: '48:35',
                videoUrl: '/videos/2.mp4',
                isFreePreview: true,
                lessonType: 'recorded_video',
                notesPdfUrl: '/assets/downloads/parabola -1.pdf',
                dppPdfUrl: '/assets/downloads/parabola -1.pdf',
                sortOrder: 1
              }
            ]
          }
        ],
        isPublished: true,
        status: 'published',
        rating: 4.9,
        reviewCount: 48,
        enrolmentCount: 142
      }
    },
    { upsert: true }
  );
  console.log('[Maintenance] Upserted Straight Lines & Parabola Masterclass.');

  const finalCourses = await collection
    .find({}, { projection: { title: 1, slug: 1, price: 1, isPublished: 1 } })
    .toArray();

  console.log(`[Maintenance] All done! Active courses in MongoDB (${finalCourses.length}):`);
  console.log(JSON.stringify(finalCourses, null, 2));

  await mongoose.disconnect();
  console.log('[Maintenance] Disconnected from MongoDB cleanly.');
}

cleanCourses().catch((err) => {
  console.error('[Maintenance Error]:', err);
  process.exit(1);
});
