# Vengineers — Kit de démarrage (Phase 0)

Ce kit correspond à la **Phase 0 — Fondations** de la roadmap (`ARCHITECTURE-VENGINEERS.md`).
Il contient tout ce qu'il faut pour lancer l'environnement Docker (mono-repo).

## 0. Pré-requis sur ta machine

- Docker + Docker Compose
- Composer (pour générer Laravel une seule fois en local)
- Node.js 20+ (pour générer le squelette React une seule fois en local)
- Git

## 1. Récupérer ce kit dans ton repo

```bash
mkdir vengineers && cd vengineers
# copie ici : docker-compose.yml, backend/, frontend/, nginx/, .github/
git init
```

## 2. Scaffolder Laravel dans backend/

Le Dockerfile s'attend à trouver un projet Laravel déjà présent dans `backend/`.
Génère-le une première fois **en local** (pas besoin de refaire ça ensuite) :

```bash
composer create-project laravel/laravel backend
cp backend/.env.example backend/.env   # utilise celui fourni dans ce kit, pas celui généré par défaut
```

Ajoute le support MongoDB (paquet officiel Laravel) :

```bash
cd backend
composer require mongodb/laravel-mongodb
cd ..
```

## 3. Scaffolder React dans frontend/

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install axios react-router-dom
cd ..
```

Crée `frontend/src/services/api.js` :

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export default api;
```

## 4. Lancer l'environnement complet

```bash
docker compose up --build
```

- Frontend (React/Vite) → http://localhost:5173
- Backend (API Laravel) → http://localhost:8000
- MySQL → localhost:3306 (user: `vengineers` / pass: `vengineers`)
- MongoDB → localhost:27017

## 5. Vérifier que tout communique

```bash
docker compose exec backend php artisan migrate
docker compose exec backend php artisan tinker
```

Dans le navigateur, `http://localhost:8000/api/user` doit répondre (même en 401, ça prouve que Nginx → PHP-FPM → Laravel fonctionne).

## 6. Prochaine étape : Phase 1 — Auth & Rôles

Une fois cette Phase 0 validée (tous les conteneurs démarrent, migration OK), passe à la Phase 1 :
- migrations `users` (avec `role_id`) et `roles`
- installer Laravel Sanctum : `composer require laravel/sanctum`
- créer le `CheckRole` middleware
- endpoints `POST /register` (client uniquement), `POST /login`, `GET /me`

👉 Idéalement, à partir de maintenant, ouvre ce repo dans **Claude Code** et donne-lui
`ARCHITECTURE-VENGINEERS.md` comme référence : il peut générer les migrations,
les modèles, les controllers et les policies phase par phase, en s'appuyant sur
ce même schéma de données.

## Pousser sur GitHub (active la CI/CD)

```bash
git add .
git commit -m "Phase 0: fondations Docker + scaffolding"
git remote add origin <ton-repo-github>
git push -u origin main
```

Les workflows `.github/workflows/backend.yml` et `frontend.yml` se déclenchent
uniquement quand tu modifies `backend/` ou `frontend/` respectivement — c'est
le mécanisme qui permet le déploiement indépendant en mono-repo (voir la
section CI/CD de `ARCHITECTURE-VENGINEERS.md`).

⚠️ Pense à créer les secrets GitHub `SONAR_TOKEN` (SonarCloud) avant de pousser,
sinon l'étape de scan échouera.
