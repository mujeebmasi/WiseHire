// Fills the database with example data so the app is usable straight away.
// Run with: npm run db:seed

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

async function main() {
  // Clear old data first so running this twice gives the same result.
  // Order matters: applications point at jobs, jobs point at organisations.
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // Every demo account uses this password.
  const password = await bcrypt.hash('password123', 10);

  // --- Candidates, one at each verification level ---------------------------
  // This is what makes the demo work: the same job accepts one of these
  // people and turns the other two away.

  const verified = await prisma.user.create({
    data: {
      email: 'verified@example.com',
      password,
      name: 'Ananya Sharma',
      headline: 'Full Stack Developer',
      location: 'Hyderabad',
      skills: ['react', 'typescript', 'nestjs', 'postgresql'],
      verification: 'GOVT_ID',
      govIdLast4: '4821',
    },
  });

  await prisma.user.create({
    data: {
      email: 'email-only@example.com',
      password,
      name: 'Rohit Verma',
      headline: 'Frontend Developer',
      location: 'Bengaluru',
      skills: ['react', 'nextjs', 'css'],
      verification: 'EMAIL',
    },
  });

  await prisma.user.create({
    data: {
      email: 'new@example.com',
      password,
      name: 'Priya Nair',
      headline: 'Final year CS student',
      location: 'Kochi',
      skills: ['javascript', 'python'],
      verification: 'NONE',
    },
  });

  // --- Employer and their company -------------------------------------------

  const employer = await prisma.user.create({
    data: {
      email: 'employer@example.com',
      password,
      name: 'Santhosh V',
      role: 'EMPLOYER',
      verification: 'GOVT_ID',
      govIdLast4: '7719',
    },
  });

  const company = await prisma.company.create({
    data: {
      name: 'Sanshi Network Tech',
      description: 'We build WiseIn, a professional network where every member is verified.',
      website: 'https://wisein.in',
      ownerId: employer.id,
    },
  });

  // A second employer, so we can prove one company cannot see another
  // company's applicants.
  const otherEmployer = await prisma.user.create({
    data: {
      email: 'other@example.com',
      password,
      name: 'Meera Iyer',
      role: 'EMPLOYER',
      verification: 'EMAIL',
    },
  });

  const otherCompany = await prisma.company.create({
    data: {
      name: 'Northwind Labs',
      description: 'A small product studio.',
      ownerId: otherEmployer.id,
    },
  });

  // --- Jobs -----------------------------------------------------------------

  const internship = await prisma.job.create({
    data: {
      companyId: company.id,
      title: 'Full Stack Developer Intern',
      description:
        'Work on our Next.js frontend and NestJS API. You will build real features using TypeScript, Prisma and PostgreSQL, with files stored on AWS S3.',
      type: 'INTERNSHIP',
      workMode: 'REMOTE',
      location: 'Remote (India)',
      skills: ['react', 'typescript', 'nestjs', 'prisma'],
      minVerification: 'GOVT_ID',
      salaryMin: 15000,
      salaryMax: 25000,
    },
  });

  await prisma.job.create({
    data: {
      companyId: company.id,
      title: 'Frontend Developer',
      description:
        'Own the web app end to end. Next.js, React and Tailwind. You will care about how fast pages feel and how clear they are to a first time visitor.',
      type: 'FULL_TIME',
      workMode: 'HYBRID',
      location: 'Hyderabad',
      skills: ['react', 'nextjs', 'typescript', 'css'],
      minVerification: 'GOVT_ID',
      salaryMin: 600000,
      salaryMax: 1200000,
    },
  });

  await prisma.job.create({
    data: {
      companyId: company.id,
      title: 'Backend Engineer',
      description:
        'Build the verification pipeline that keeps fake accounts off the platform. Lots of PostgreSQL, Prisma and AWS work.',
      type: 'FULL_TIME',
      workMode: 'ONSITE',
      location: 'Hyderabad',
      skills: ['nestjs', 'postgresql', 'prisma', 'aws'],
      minVerification: 'GOVT_ID',
      salaryMin: 900000,
      salaryMax: 1800000,
    },
  });

  // Set to EMAIL on purpose, so you can see that the rule is per job
  // and not the same for the whole site.
  await prisma.job.create({
    data: {
      companyId: otherCompany.id,
      title: 'React Native Intern',
      description:
        'Help us ship our mobile app. React Native with Expo, talking to a REST API. A good first role if you have built something small on your own.',
      type: 'INTERNSHIP',
      workMode: 'REMOTE',
      location: 'Remote',
      skills: ['react', 'react-native'],
      minVerification: 'EMAIL',
      salaryMin: 10000,
      salaryMax: 18000,
    },
  });

  // Open to everyone, including brand new accounts.
  await prisma.job.create({
    data: {
      companyId: otherCompany.id,
      title: 'Technical Writer',
      description:
        'Write our API documentation and onboarding guides. You will read TypeScript and turn it into something a new developer can follow.',
      type: 'CONTRACT',
      workMode: 'REMOTE',
      skills: ['writing', 'documentation'],
      minVerification: 'NONE',
      salaryMin: 40000,
      salaryMax: 60000,
    },
  });

  // --- One application already in progress ----------------------------------
  // Upload a small placeholder PDF so the employer's "View resume" button
  // works on this seeded application instead of showing an error.
  const resumeKey = `resumes/${verified.id}/example-resume.pdf`;
  await uploadPlaceholderResume(resumeKey, 'Ananya Sharma');

  await prisma.application.create({
    data: {
      jobId: internship.id,
      userId: verified.id,
      resumeKey,
      resumeName: 'ananya-sharma-resume.pdf',
      coverNote:
        'I have built a Next.js and NestJS app with Prisma and PostgreSQL.',
      stage: 'SHORTLISTED',
    },
  });

  console.log(`
Done. Every account below uses the password: password123

  CANDIDATES
    verified@example.com     government ID verified  - can apply to everything
    email-only@example.com   email verified          - blocked from most jobs
    new@example.com          not verified            - blocked from nearly all

  EMPLOYERS
    employer@example.com     Sanshi Network Tech
    other@example.com        Northwind Labs

  5 jobs, 1 application already shortlisted.
`);
}

// Puts the placeholder PDF in the same bucket the app uses, so the seeded
// application behaves exactly like a real one.
async function uploadPlaceholderResume(key: string, name: string) {
  const s3 = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_KEY_ID as string,
      secretAccessKey: process.env.S3_KEY_SECRET as string,
    },
    ...(process.env.S3_ENDPOINT
      ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }
      : {}),
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: placeholderPdf(name),
      ContentType: 'application/pdf',
    }),
  );
}

// The smallest PDF a browser will open, with one line of text on it.
// Only used so the demo has something to show behind "View resume".
function placeholderPdf(name: string) {
  const text = `BT /F1 18 Tf 40 120 Td (${name} - example resume) Tj ET`;

  return Buffer.from(
    [
      '%PDF-1.4',
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 400 200]' +
        '/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj',
      '4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj',
      `5 0 obj<</Length ${text.length}>>stream`,
      text,
      'endstream endobj',
      'trailer<</Size 6/Root 1 0 R>>',
      '%%EOF',
    ].join('\n'),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
