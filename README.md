# FindMyPix

A face-similarity search service using embeddings, with a Python/SQLAlchemy/PostgreSQL + pgvector backend and a Next.js frontend.

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

   You will also need to install PyTorch, you can find the install command on their [site](https://pytorch.org/get-started/locally/). Make sure that you donwload the proper version that match your cuda toolkit version ;)

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

   ### Environment Variables
   Before running the application, you'll need to set up your environment variables.
   Create a `.env.local` file in the root directory and populate it with your
   configuration. You can use the provided `.env.local.example` file as a
   reference for the required variables.

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
docker compose up -d
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

5. Setup environement
   On the frontend there is also 2 env files that you need to have. the .env and .env.local, there are respectievely .{env}.example and .{env}.local.example that are starting point for you.
   

---

## Running the Frontend

```bash

docker compose up -d
cd event-photo-finder
npm install    # or yarn
npm run dev
```

Open http://localhost:3000

---

## TODO

**High priority**  
- Create the procesing queue also in the backend so that reloading the page does not make you lose the whole state. store in cookies and give additional data fetch via polling
- Add optimization features to support large galleries

**Mid priority**  
- Bulk-folder upload support
- Multi-image search  / Video from our face from left to right
- If input image as multiple detected visage prompt to choose a specific one

**Low priority**  
- Better delete confirmation on manage page
- More upload status info (pending, progress bar, face count…)
- Draw bounding boxes around detected faces


