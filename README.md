# FindMyPix

A face-similarity search service using embeddings, with a Python/SQLAlchemy/PostgreSQL + pgvector backend and a Next.js frontend.

---

## TODO

**High priority**  
- My Events page  
- Add titles to events

**Mid priority**  
- Bulk-folder upload support  
- Image compression on upload  
- Backend queuing for large batches  
- Multi-image search  
- Frontend pagination for large galleries  
- Draw bounding boxes around detected faces

**Low priority**  
- Better delete confirmation  
- More upload status info (pending, progress bar, face count…)

---

## Table of Contents

1. [Description](#description)  
2. [Prerequisites](#prerequisites)  
3. [Installation](#installation)  
4. [Database Configuration](#database-configuration)  
5. [Alembic Migrations](#alembic-migrations)  
6. [Quick Reset](#quick-reset)  
7. [Running the Backend](#running-the-backend)  
8. [Running the Auth DB (Docker)](#running-the-auth-db-docker)  
9. [Prisma Setup (Next.js)](#prisma-setup-nextjs)  
10. [Running the Frontend](#running-the-frontend)  
11. [Environment Files](#environment-files)  
12. [Contributing](#contributing)

---

## Description

- Extract face embeddings from images  
- Store them in PostgreSQL with the pgvector extension  
- Perform ANN searches via SQL  
- Provide a simple Next.js UI for upload and search

---

## Prerequisites

- Linux/macOS/Windows WSL  
- Git  
- Python 3.8+  
- Node.js 16+ and npm/yarn  
- Docker (for the NextAuth DB)  
- PostgreSQL 14+ (backend Python)  
- `pgvector` PostgreSQL extension

---

## Installation

1. Clone the repo

   ```bash
   git clone https://github.com/your-username/FindMyPix.git
   cd FindMyPix
   ```

2. Backend (Python)

   ```bash
   cd python-backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

---

## Database Configuration

1. Install PostgreSQL & pgvector

   ```bash
   sudo apt update
   sudo apt install -y postgresql postgresql-contrib build-essential
   git clone https://github.com/pgvector/pgvector.git
   cd pgvector && make && sudo make install && cd ..
   ```

2. Create role, database & extension _line by line_

   ```bash
   sudo -u postgres psql
   ```

   In the `psql` prompt:

   ```sql
   CREATE ROLE face_user WITH LOGIN PASSWORD 'your_password';
   CREATE DATABASE face_db OWNER face_user;
   \c face_db
   CREATE EXTENSION IF NOT EXISTS vector;
   \q
   ```

3. Export the connection URL

   ```bash
   export DATABASE_URL="postgresql+psycopg2://face_user:your_password@\localhost:5432/face_db"
   ```

---

## Alembic Migrations

1. Initialize (if needed)

   ```bash
   alembic init migrations
   ```

2. In `migrations/env.py`, point to your `Base`:

   ```python
   from your_module import Base
   target_metadata = Base.metadata
   ```

3. Generate & apply

   ```bash
   alembic revision --autogenerate -m "create faces schema"
   alembic upgrade head
   ```

---

## Quick Reset

```bash
# Option A: drop & recreate
dropdb face_db
createdb face_db
psql -d face_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
alembic upgrade head

# Option B: alembic downgrade & upgrade
alembic downgrade base
alembic upgrade head
```

---

## Running the Backend

```bash
cd python-backend
source .venv/bin/activate
uvicorn app.main:app \
  --reload \
  --host 0.0.0.0 \
  --port 8000
```

---

## Running the Auth DB (Docker)

NextAuth needs its own PostgreSQL. Launch it with Docker:

```bash
docker run -d \
  --name my_app_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=my_app \
  -p 5435:5432 \
  postgres:14
```

Verify it’s running:

```bash
docker ps | grep my_app_db
```

---

## Prisma Setup (Next.js)

1. In the Next.js folder:

   ```bash
   cd event-photo-finder
   npm install prisma @prisma/client
   ```

2. Initialize Prisma (if not already done):

   ```bash
   npx prisma init
   ```

3. Make sure your existing `prisma/schema.prisma` defines the required models for NextAuth (e.g. User, Account, Session, VerificationToken).

4. Run migration & generate the client:

   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. Configure NextAuth in `pages/api/auth/[...nextauth].ts`:

   ```ts
   import { PrismaAdapter } from "@next-auth/prisma-adapter";
   import { PrismaClient } from "@prisma/client";
   import NextAuth from "next-auth";
   import Providers from "next-auth/providers";

   const prisma = new PrismaClient();

   export default NextAuth({
     adapter: PrismaAdapter(prisma),
     providers: [
       Providers.GitHub({
         clientId: process.env.GITHUB_ID!,
         clientSecret: process.env.GITHUB_SECRET!,
       }),
     ],
     secret: process.env.NEXTAUTH_SECRET,
   });
   ```

---

## Running the Frontend

```bash
cd event-photo-finder
npm install    # or yarn
npm run dev
```

Open http://localhost:3000

---

## Environment Files

Create these two files in `event-photo-finder/` (they’re gitignored):

.env
```dotenv
DATABASE_URL="postgresql://postgres:password@localhost:5435/my_app"
FACE_API_HOST="http://localhost:8000"
```

.env.local
```dotenv
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL="http://localhost:3000"

DATABASE_URL="postgresql://postgres:password@localhost:5435/my_app"
FACE_API_HOST="http://localhost:8000"
NEXT_PUBLIC_EXTERNAL_API="http://localhost:8000"
NEXT_PUBLIC_EXTERNAL="http://localhost:8000"
NEXTAUTH_JWT_ENCRYPTION_KEY="DDdmKcM+h6bILUz0G0R48mm6HO2AlSXs/f6zkkN6sog="
```

---

## Contributing

1. Fork the repo  
2. Create a branch `feature/...`  
3. Commit your changes & tests  
4. Open a Pull Request  

Thank you for your contributions!
