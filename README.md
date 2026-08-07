# Vengineers — Plateforme Web B2B (Vitrine + E-commerce + Gestion d'interventions)

Plateforme web pour Vengineers, société basée à l'Île Maurice spécialisée dans les
solutions d'affichage interactif grand format (partenaires Dell, eBeam, Cyberoam).
Remplace l'ancien site Joomla/VirtueMart par une SPA React + API Laravel, avec un
site vitrine public, un espace e-commerce B2B et un système de gestion
d'interventions techniques réparti sur 4 espaces privés (Admin, Commercial,
Technicien, Client).

> Pour l'architecture complète (rôles, schéma BDD, roadmap détaillée), voir
> [`ARCHITECTURE-VENGINEERS.md`](./ARCHITECTURE-VENGINEERS.md).

---

## Sommaire

- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Structure du projet](#structure-du-projet)
- [Installation — premier lancement](#installation--premier-lancement)
- [Lancer le projet au quotidien](#lancer-le-projet-au-quotidien)
- [Variables d'environnement](#variables-denvironnement)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Tests](#tests)
- [Commandes utiles](#commandes-utiles)
- [Qualité de code / CI](#qualité-de-code--ci)
- [Problèmes fréquents](#problèmes-fréquents)

---

## Stack technique

| Couche | Techno |
|---|---|
| Frontend | React + Vite, Tailwind CSS |
| Backend | Laravel 11 + Sanctum (API REST) |
| Base de données métier | MySQL |
| Logs / historique | MongoDB |
| Conteneurisation | Docker Compose |
| Tests backend | Pest |
| Tests frontend | Vitest + Testing Library |
| Qualité de code | SonarCloud (quality gate bloquant sur `main`) |
| CI/CD | GitHub Actions |

---

## Prérequis

À installer sur la machine avant de commencer :

| Outil | Version recommandée | Vérifier avec |
|---|---|---|
| [Docker](https://docs.docker.com/get-docker/) | récente (Docker Desktop ou Engine) | `docker --version` |
| [Docker Compose](https://docs.docker.com/compose/) | v2 (intégré à Docker Desktop) | `docker compose version` |
| [Git](https://git-scm.com/) | récente | `git --version` |
| [Node.js](https://nodejs.org/) | 18+ (LTS) | `node --version` |
| npm | fourni avec Node | `npm --version` |

> **Composer et PHP ne sont pas requis en local** : le backend Laravel tourne
> intégralement dans le conteneur Docker `backend`. Toutes les commandes
> `composer`/`artisan` passent par `docker compose exec backend ...`.

---

## Structure du projet

```
vengineers-starter/
├── backend/                # API Laravel 11
│   ├── app/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/api.php
│   ├── tests/              # Pest
│   └── .env                # à créer (voir plus bas)
├── frontend/                # SPA React + Vite
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/api.js
│   │   └── routes/
│   ├── tests/               # Vitest
│   └── .env                 # à créer (voir plus bas)
├── docker-compose.yml
└── ARCHITECTURE-VENGINEERS.md
```

---

## Installation — premier lancement

Ces étapes ne sont à faire qu'**une seule fois** (ou après un `git clone` sur une
nouvelle machine).

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd vengineers-starter
```

### 2. Créer les fichiers d'environnement

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Adapter les valeurs si besoin (voir [Variables d'environnement](#variables-denvironnement)
plus bas). Pour un tout premier lancement en local, les valeurs par défaut du
`.env.example` fonctionnent normalement telles quelles.

### 3. Lancer les conteneurs

```bash
docker compose up -d --build
```

Ceci démarre les services : `backend` (PHP-FPM + Laravel), `nginx`, `mysql`,
`mongo`, et le conteneur `frontend` (Node/Vite) si celui-ci est inclus dans le
`docker-compose.yml`. Vérifier que tout tourne :

```bash
docker compose ps
```

### 4. Installer les dépendances PHP (backend)

```bash
docker compose exec backend composer install
```

### 5. Générer la clé d'application Laravel

```bash
docker compose exec backend php artisan key:generate
```

### 6. Lancer les migrations + seeders

```bash
docker compose exec backend php artisan migrate --seed
```

Ceci crée toutes les tables (`users`, `roles`, `products`, `orders`,
`interventions`, etc.) et injecte les données de démonstration (rôles, compte
admin, catalogue produits avec images placeholder, etc.).

### 7. Corriger les permissions de stockage (si erreur "Permission denied")

Sous Linux/macOS, il arrive que `storage/` et `bootstrap/cache/` n'aient pas les
bons droits après le build de l'image :

```bash
docker compose exec backend chmod -R 775 storage bootstrap/cache
docker compose exec backend chown -R www-data:www-data storage bootstrap/cache
```

### 8. Installer les dépendances front (React)

```bash
cd frontend
npm install
cd ..
```

### 9. Lancer le serveur de dev front

```bash
cd frontend
npm run dev
```

### 10. Vérifier que tout fonctionne

- API Laravel : `http://localhost:8000/api` (ou le port défini dans `docker-compose.yml`)
- Frontend React : `http://localhost:5173` (port par défaut de Vite)

Tester rapidement l'API :

```bash
curl -H "Accept: application/json" http://localhost:8000/api/products
```

> Une réponse JSON avec la liste des produits confirme que le backend, la base
> MySQL et les seeders fonctionnent correctement.

---

## Lancer le projet au quotidien

Une fois l'installation initiale faite, le lancement quotidien se résume à :

```bash
docker compose up -d          # backend + DB (MySQL, MongoDB) + nginx
cd frontend && npm run dev    # frontend (dans un second terminal)
```

Pour tout arrêter :

```bash
docker compose down
```

Pour tout arrêter en supprimant aussi les volumes (⚠️ efface les données MySQL/Mongo) :

```bash
docker compose down -v
```

---

## Variables d'environnement

### Backend (`backend/.env`)

Les variables clés à connaître (voir `.env.example` pour la liste complète) :

| Variable | Description | Valeur dev par défaut |
|---|---|---|
| `APP_URL` | URL de base de l'API | `http://localhost:8000` |
| `DB_CONNECTION` | Connexion MySQL | `mysql` |
| `DB_HOST` | Nom du service Docker MySQL | `mysql` (nom du service dans `docker-compose.yml`) |
| `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Identifiants MySQL | définis dans `docker-compose.yml` |
| `MONGO_HOST`, `MONGO_DATABASE` | Connexion MongoDB (logs) | service `mongo` |
| `MAIL_MAILER` | Driver email | **`log`** en dev — les emails ne partent pas réellement, ils s'écrivent dans `storage/logs/laravel.log` |
| `SANCTUM_STATEFUL_DOMAINS` | Domaines autorisés pour l'auth SPA | `localhost:5173` |

> ⚠️ `MAIL_MAILER=log` est volontaire en développement. Le passage à un vrai
> SMTP (Gmail ou serveur du client) n'intervient qu'au déploiement final.

### Frontend (`frontend/.env`)

| Variable | Description | Valeur dev par défaut |
|---|---|---|
| `VITE_API_URL` | URL de base de l'API consommée par Axios | `http://localhost:8000/api` |

---

## Comptes de démonstration

Après `php artisan migrate --seed`, un compte administrateur est créé par le
seeder (voir `database/seeders/` pour les identifiants exacts — généralement
listés en commentaire dans `AdminSeeder`/`DatabaseSeeder`). Les comptes
Commercial/Technicien ne peuvent être créés que par l'Admin (aucune
auto-inscription pour ces rôles) ; les comptes Client s'auto-inscrivent via la
page `/register` du site.

---

## Tests

### Backend (Pest)

```bash
docker compose exec backend php artisan test
```

Ou avec couverture :

```bash
docker compose exec backend php artisan test --coverage
```

### Frontend (Vitest)

```bash
cd frontend
npm run test
```

Ou en mode watch :

```bash
npm run test -- --watch
```

---

## Commandes utiles

```bash
# Ouvrir un shell dans le conteneur backend
docker compose exec backend bash

# Rejouer les migrations depuis zéro (⚠️ efface les données)
docker compose exec backend php artisan migrate:fresh --seed

# Voir les logs backend en direct
docker compose logs -f backend

# Voir les emails "envoyés" en dev (MAIL_MAILER=log)
docker compose exec backend tail -f storage/logs/laravel.log

# Tinker (console interactive Laravel)
docker compose exec backend php artisan tinker

# Lister les routes API
docker compose exec backend php artisan route:list --path=api
```

---

## Qualité de code / CI

- Chaque push/PR déclenche un pipeline GitHub Actions : lint → tests unitaires →
  tests feature → scan SonarCloud.
- Le **Quality Gate SonarCloud est bloquant sur `main`** (il ne tourne pas sur
  les branches `feature/*`/`chore/*`, seulement au moment du merge vers `main`).
- Convention de branches : `main`, `feature/*`, `chore/*` — pas de branche
  `develop`.

---

## Problèmes fréquents

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Permission denied` sur `storage/logs/laravel.log` | Permissions incorrectes sur `storage/`/`bootstrap/cache` | Voir étape 7 de l'installation |
| `Route [login] not defined` / erreur 500 inattendue sur une route API | Header `Accept: application/json` manquant dans l'appel | Toujours ajouter `-H "Accept: application/json"` aux appels `curl` |
| Erreur de connexion MySQL au démarrage | Le conteneur `mysql` n'a pas fini son initialisation avant que `backend` ne tente de s'y connecter | Attendre quelques secondes puis relancer, ou `docker compose restart backend` |
| Colonne "fantôme" manquante en test alors que confirmée en tinker/dev | Fichier `database/database.sqlite` physique périmé (si utilisé en test) | `rm database/database.sqlite && touch database/database.sqlite` puis rejouer les tests |
| Page de détail (commande/intervention) ne s'affiche jamais | Le `public_id` contient un `#` non encodé dans l'URL | Vérifier que `encodeURIComponent()` est bien utilisé dans le code front concerné |

---

## Prochaines étapes du projet

Voir la roadmap complète dans
[`ARCHITECTURE-VENGINEERS.md`](./ARCHITECTURE-VENGINEERS.md), section 6.
État d'avancement actuel : **Phase 3 close**, **Phase 4 (Dashboard Commercial)
en cours de démarrage**.