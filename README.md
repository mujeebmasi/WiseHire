# WiseHire

A job board where a company can say **"only people who have verified their
identity may apply to this job"** — and the server actually enforces it.

Built with React, TypeScript, Next.js, NestJS, PostgreSQL and Prisma.

---

## The idea

Normal job boards let anyone apply with any claim about themselves. Employers
then waste time filtering out applications they cannot trust.

Here, each job carries a **minimum verification level**. When someone applies,
the API compares their level against the job's requirement, and refuses the
application if it is too low. Employers only ever see applicants who passed.

There are three levels:

| Level     | What it means                     |
| --------- | --------------------------------- |
| `NONE`    | They just made an account         |
| `EMAIL`   | They confirmed their email        |
| `GOVT_ID` | Their Aadhaar / DigiLocker passed |

The whole rule is six lines, in `backend/src/verification.ts`:

```ts
const LEVEL_VALUE = { NONE: 0, EMAIL: 1, GOVT_ID: 2 };

export function isVerifiedEnough(userLevel, required) {
  return LEVEL_VALUE[userLevel] >= LEVEL_VALUE[required];
}
```

And it is used in one place that matters — `applications.service.ts`, when
somebody tries to apply.

> **The ID check is simulated.** Real Aadhaar or DigiLocker access needs a
> licensed government API partner. `auth.service.ts` fakes it: any 12 digits
> plus the OTP `123456` counts as verified. Only the last 4 digits are ever
> saved. Everything built around it is real.

---

## What's in the project

```
backend/                  NestJS API
  prisma/
    schema.prisma         the 4 database tables
    seed.ts               example data to start with
  src/
    main.ts               starts the server
    app.module.ts         lists every module
    verification.ts       the rule above
    prisma.service.ts     database connection
    auth/                 register, login, verify ID
    company/              an employer's company details
    jobs/                 create and list jobs
    applications/         applying, and the employer's applicant list
    storage/              saving and reading resume files

frontend/                 Next.js app
  app/                    one folder per page
  components/             pieces shared between pages
  lib/
    api.ts                every call to the backend
    auth.tsx              remembers who is logged in
    types.ts              shapes of the data
```

Each NestJS folder has the same three files, which is the standard pattern:

- **controller** — the URLs, and what happens at each one
- **service** — the actual logic and database work
- **module** — wires the two together so Nest can find them

---

## Running it

You need **Node.js** and **PostgreSQL** installed. Nothing else.

### 1. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and put your PostgreSQL password into `DATABASE_URL`.

### 2. Create the database and fill it with example data

```bash
npm run db:migrate
npm run db:seed
```

`db:migrate` creates the `wisehire` database and its tables. `db:seed` adds
example users and jobs.

### 3. Start the API

```bash
npm run start:dev
```

It runs on http://localhost:4000

### 4. Start the frontend, in a second terminal

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## Try it

All the seeded accounts use the password `password123`.

| Email                     | Who they are           |
| ------------------------- | ---------------------- |
| `verified@example.com`    | Candidate, ID verified |
| `email-only@example.com`  | Candidate, email only  |
| `new@example.com`         | Candidate, brand new   |
| `employer@example.com`    | Employer               |

**The 30 second demo:**

1. Log in as `email-only@example.com`
2. Open **Full Stack Developer Intern** — instead of an apply form you get
   "You need to verify your identity first"
3. Go to **Verify ID**, type any 12 digits and the OTP `123456`
4. Go back to the job — the apply form is now there
5. Log out, log in as `employer@example.com`, open **My jobs**, move the
   applicant through the stages and write them a message
6. Log back in as the candidate — the new stage and the message are both on
   **My applications**

Or start from scratch as an employer: sign up choosing **Hiring**, add your
company, then **Post a job** and pick which verification level it requires.

---

## How hiring works

An application moves along one path:

```
Applied  ->  Shortlisted  ->  Interview  ->  Offer  ->  Hired
                    (or "Not selected" at any point)
```

The employer never picks a stage from a list. Each applicant card shows the
one button that makes sense next - **Shortlist**, then **Invite to
interview**, then **Make an offer**, then **Hire** - alongside **Not
selected**. Whatever you type in the note box is sent with the decision, so
the candidate never sees their status change without knowing why.

The applicant list is split into **Still deciding** and **Decided**, so people
waiting on you are not buried under ones you have already answered. A decided
application can be reopened if you change your mind.

The candidate sees a progress bar showing how far along they are, and a plain
answer once it ends: *You got the job*, or *Not selected this time*.

Where this lives: `NEXT_STEP` in `frontend/lib/types.ts` is the whole flow, as
a plain object. Changing the hiring steps means editing that one map.

---

## Where resumes are stored

Uploaded PDFs go into `backend/uploads/`, which is listed in `.gitignore` so
nobody's CV ends up in the repository.

Everything that touches a stored file goes through `storage.service.ts`. That is
on purpose: moving to cloud storage later means changing that one file, and
nothing that calls it has to know the difference.

---

## Things worth knowing about the code

**Passwords are never stored.** `bcrypt.hash()` turns the password into
something that cannot be reversed. At login we hash the attempt and compare the
two hashes.

**The database stops duplicate applications, not the code.** `schema.prisma`
has `@@unique([jobId, userId])`. Checking "have they already applied?" in code
first would not be safe, because two requests arriving at the same instant would
both pass the check before either saved. The database cannot be fooled that way.

**We reload the user on every request.** `jwt.strategy.ts` looks the user up
instead of trusting what is inside the token. Someone may have verified their ID
after their token was created, and the token would still say they had not.

**Resumes are not public files.** They are stored outside the web root, and the
only way to read one is `GET /applications/:id/resume`, which checks you are
either the candidate who applied or the employer who posted the job. The
frontend cannot use a plain link for this, because a link would not carry the
login token - so it fetches the file and opens it from memory instead.

**Employers can only see their own applicants.** `jobs.service.ts` has
`checkJobIsMine()`, which every employer route calls first. The same check
guards writing a message back, so a candidate cannot put words in an
employer's mouth on their own application.

**A failed request does not log you out.** `auth.tsx` only forgets your token
when the server actually answers 401. An earlier version cleared it on any
error, so restarting the API signed everyone out.

---

## Tests

```bash
cd backend
npm test
```

They cover the verification rule — the part where a bug would let the wrong
person apply.

---

## Deploying it later

Right now this runs on your machine. To put it online you need three things: a
host for the API, a host for the frontend, and a PostgreSQL database.

The one change the code needs is where files are stored - a normal server has
no permanent disk, so `storage.service.ts` would move to S3 or similar. That is
the only file affected, which is why it exists as its own service.
