# FindMyPix

Un service de recherche de visages par similarité d'embeddings, avec un backend Python/SQLAlchemy/PostgreSQL + pgvector et un frontend Next.js.

---

## Table des matières

1. [Description](#description)  
2. [Prérequis](#prérequis)  
3. [Installation](#installation)  
4. [Configuration de la base de données](#configuration-de-la-base-de-données)  
5. [Migrations Alembic](#migrations-alembic)  
6. [Reset / Réinitialisation rapide](#reset--réinitialisation-rapide)  
7. [Lancer le backend](#lancer-le-backend)  
8. [Lancer le frontend Next.js](#lancer-le-frontend-nextjs)  
9. [Contribuer](#contribuer)  

---

## Description

Ce projet permet :
- d’extraire des embeddings de visages à partir d’images,  
- de les stocker dans une base PostgreSQL enrichie de l’extension pgvector,  
- de faire des recherches de plus proches voisins (ANN) via SQL.  
- de proposer une interface web simple en Next.js pour l’upload et la recherche.

---

## Prérequis

- Linux / macOS / Windows WSL  
- Git  
- Python 3.8+  
- Node.js 16+ et npm/yarn  
- PostgreSQL 14+  
- `pgvector` (extension PostgreSQL)

---

## Installation

1. Clonez le dépôt  
   ```bash
   git clone https://github.com/votre-utilisateur/FindMyPix.git
   cd FindMyPix

   ```

2. Créez un environnement Python virtuel et installez les dépendances  
   ```bash
   cd python-backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

---

## Configuration de la base de données

1. Installez PostgreSQL et l’extension pgvector  
   ```bash
   sudo apt update
   sudo apt install -y postgresql postgresql-contrib build-essential
   git clone https://github.com/pgvector/pgvector.git
   cd pgvector && make && sudo make install && cd ..
   ```

2. Démarrez PostgreSQL et créez l’utilisateur/la base  
   ```bash
   sudo systemctl start postgresql
   sudo -u postgres psql <<SQL
   CREATE ROLE face_user WITH LOGIN PASSWORD 'votre_mot_de_passe';
   CREATE DATABASE face_db OWNER face_user;
   \c face_db
   CREATE EXTENSION IF NOT EXISTS vector;
   \q
   ```

3. Exportez l’URL de connexion  
   ```bash
   export DATABASE_URL="postgresql+psycopg2://face_user:votre_mot_de_passe@localhost:5432/face_db"
   ```

---

## Migrations Alembic

1. Initialisez (si ce n’est pas déjà fait)  
   ```bash
   alembic init migrations
   ```
2. Vérifiez que dans `migrations/env.py` vous importez bien `Base` et définissez  
   ```python
   from your_module import Base
   target_metadata = Base.metadata
   ```
3. Générez la migration initiale  
   ```bash
   alembic revision --autogenerate -m "create faces schema"
   ```
4. Appliquez-la  
   ```bash
   alembic upgrade head
   ```

---

## Reset / Réinitialisation rapide

En développement, pour repartir à zéro :

```bash
# Option A : drop & recreate DB
dropdb face_db
createdb face_db
psql -d face_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
alembic upgrade head

# Option B : Alembic downgrade base + upgrade
alembic downgrade base
alembic upgrade head
```

---

## Lancer le backend

Le code d’exemple se trouve dans `main.py` ou via un script CLI :

```bash
source .venv/bin/activate
uvicorn app.main:app \
  --reload \
  --host 0.0.0.0 \
  --port 8000

```

Vous pouvez aussi exposer une API (FastAPI/Flask) dans `app.py`, etc.

---

## Lancer le frontend Next.js

```bash
cd event-photo-finder
npm install    # ou yarn
npm run dev    # démarrer le serveur de développement
```

Ouvrez http://localhost:3000 dans votre navigateur.

---

## Contribuer

1. Forkez le dépôt  
2. Créez une branche feature/fix (`git checkout -b feature/ma-nouvelle-fonction`)  
3. Codez, testez, puis  
   ```bash
   git commit -am "Ajout: description de la MAJ"
   git push origin feature/ma-nouvelle-fonction
   ```  
4. Ouvrez une Pull Request  

Merci et bonne contribution !
