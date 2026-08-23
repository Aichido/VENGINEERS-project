# Vengineers — Plateforme Web B2B (Vitrine + E-commerce + Gestion d'interventions)

Plateforme web pour Vengineers, société basée à l'Île Maurice spécialisée dans les
solutions d'affichage interactif grand format (partenaires Dell, eBeam, Cyberoam).
Remplace l'ancien site Joomla/VirtueMart par une SPA React + API Laravel, avec un
site vitrine public, un espace e-commerce B2B et un système de gestion
d'interventions techniques réparti sur 4 espaces privés (Admin, Commercial,
Technicien, Client).

---

## Sommaire

- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Structure du projet](#structure-du-projet)
- [Premier démarrage (nouvelle machine / nouveau clone)](#premier-démarrage-nouvelle-machine--nouveau-clone)
- [Utilisation quotidienne](#utilisation-quotidienne)
- [Mettre à jour un projet déjà installé (pull + rebuild)](#mettre-à-jour-un-projet-déjà-installé-pull--rebuild)
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
| Backend | Laravel 13.8 / PHP 8.3 + Sanctum (API REST) |
| Base de données métier | MySQL |
| Logs / historique | MongoDB |
| Conteneurisation | Docker Compose |
| Tests backend | Pest |
| Tests frontend | Vitest + Testing Library |
| Qualité de code | SonarCloud (quality gate bloquant sur `main`) |
| CI/CD | GitHub Actions |

---

## Prérequis

À installer sur la machine avant de commencer — **tout le reste (PHP, Composer,
Node, npm) tourne dans les conteneurs Docker et n'a pas besoin d'être installé
en local** :

| Outil | Version recommandée | Vérifier avec |
|---|---|---|
| [Docker](https://docs.docker.com/get-docker/) | récente (Docker Desktop ou Engine) | `docker --version` |
| [Docker Compose](https://docs.docker.com/compose/) | v2 (intégré à Docker Desktop) | `docker compose version` |
| [Git](https://git-scm.com/) | récente | `git --version` |

> Toutes les commandes de ce document passent par `docker compose exec ...`.
> Aucune commande `composer`, `php`, `npm` ou `node` n'est censée être lancée
> directement sur la machine hôte.

---

## Structure du projet

```
vengineers-starter/
├── backend/                # API Laravel
│   ├── app/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/api.php
│   ├── tests/               # Pest
│   └── .env                 # à créer (voir plus bas)
├── frontend/                # SPA React + Vite
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/api.js
│   │   └── routes/
│   ├── tests/                # Vitest
│   └── .env                  # à créer (voir plus bas)
├── docker-compose.yml
```

---

## Premier démarrage (nouvelle machine / nouveau clone)

Ces étapes ne sont à faire qu'**une seule fois** : à l'installation initiale, ou
après un `git clone` sur une nouvelle machine. Pour l'usage de tous les jours
une fois que c'est fait, voir directement la section
[Utilisation quotidienne](#utilisation-quotidienne) plus bas.

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

### 3. Construire les images et lancer les conteneurs

```bash
docker compose up -d --build
```

Ceci construit puis démarre tous les services définis dans `docker-compose.yml`
(`backend` PHP-FPM, `nginx`, `mysql`, `mongo`, `frontend`). Vérifier que tout
tourne :

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
docker compose exec frontend npm install
```

### 9. Vérifier que tout fonctionne

- API Laravel : `http://localhost:8000/api`
- Frontend React : `http://localhost:5173`

Tester rapidement l'API :

```bash
docker compose exec backend curl -H "Accept: application/json" http://localhost:8000/api/products
```

> Une réponse JSON avec la liste des produits confirme que le backend, la base
> MySQL et les seeders fonctionnent correctement.

**Le premier démarrage est terminé.** Pour la suite, au quotidien, voir la
section suivante.

---

## Utilisation quotidienne

Une fois l'installation initiale faite (section précédente), le lancement de
tous les jours se résume à ces quelques commandes.

### Démarrer la journée de travail

```bash
docker compose up -d
```

Démarre tous les conteneurs en arrière-plan (backend, nginx, mysql, mongo,
frontend). Le frontend est alors accessible sur `http://localhost:5173` et
l'API sur `http://localhost:8000/api`.

### Voir l'état des conteneurs

```bash
docker compose ps
```

### Suivre les logs en direct pendant qu'on travaille

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Mettre en pause à la fin de la journée (sans tout supprimer)

```bash
docker compose stop
```

Arrête les conteneurs sans les supprimer ni toucher aux volumes (données MySQL/
Mongo conservées). Pour repartir le lendemain, un simple `docker compose up -d`
relance tout à l'identique.

### Arrêter et supprimer les conteneurs (garde les données)

```bash
docker compose down
```

### Tout arrêter en supprimant aussi les volumes (⚠️ efface les données MySQL/Mongo)

```bash
docker compose down -v
```

À n'utiliser que si tu veux repartir d'une base de données totalement vierge.

---

## Mettre à jour un projet déjà installé (pull + rebuild)

Cas de figure : le projet est **déjà cloné et installé** sur la machine, et de
nouveaux commits sont arrivés sur `main` (ou sur la branche sur laquelle tu
travailles) — potentiellement avec des changements de dépendances (`composer.json`,
`package.json`) ou de `Dockerfile`.

### 1. Récupérer les derniers changements

```bash
git pull origin main
```

(remplacer `main` par le nom de la branche concernée si besoin)

### 2. Un `Dockerfile`, `composer.json` ou `package.json` a changé ?

Si le `git pull` a modifié un `Dockerfile` (backend ou frontend), ou une
dépendance (`composer.json`/`composer.lock`, `package.json`/`package-lock.json`),
il faut reconstruire l'image concernée pour que le changement soit réellement
appliqué — un simple redémarrage des conteneurs ne suffit pas :

```bash
docker compose build --no-cache
docker compose up -d --build
```

Pour ne reconstruire qu'un seul service (plus rapide, ex. seulement le
backend) :

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

### 3. Seul du code applicatif a changé (pas de Dockerfile/dépendances) ?

Pas besoin de rebuild d'image dans ce cas — il suffit de relancer les
migrations si de nouvelles ont été ajoutées, et de réinstaller les dépendances
si `composer.lock`/`package-lock.json` ont bougé même sans changement de
Dockerfile :

```bash
docker compose exec backend composer install
docker compose exec backend php artisan migrate
docker compose exec frontend npm install
```

### 4. Vérifier les permissions après un rebuild

Un rebuild peut recréer certains dossiers avec de mauvais droits (`storage/`,
`bootstrap/cache/`) :

```bash
docker compose exec backend chown -R www-data:www-data storage bootstrap/cache
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

Après `docker compose exec backend php artisan migrate --seed`, un compte
administrateur est créé par le seeder (voir `database/seeders/` pour les
identifiants exacts — généralement listés en commentaire dans
`AdminSeeder`/`DatabaseSeeder`). Les comptes Commercial/Technicien ne peuvent
être créés que par l'Admin (aucune auto-inscription pour ces rôles) ; les
comptes Client s'auto-inscrivent via la page `/register` du site.

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
docker compose exec frontend npm run test
```

Ou avec couverture :

```bash
docker compose exec frontend npm run test -- --coverage
```

Ou en mode watch :

```bash
docker compose exec frontend npm run test -- --watch
```

### Lint frontend

```bash
docker compose exec frontend npm run lint
```

---

## Commandes utiles

```bash
# Ouvrir un shell dans le conteneur backend
docker compose exec backend bash

# Ouvrir un shell dans le conteneur frontend
docker compose exec frontend sh

# Rejouer les migrations depuis zéro (⚠️ efface les données)
docker compose exec backend php artisan migrate:fresh --seed

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
- Rate limiting API : 60 requêtes/minute par défaut sur le groupe `api`.
- Headers de sécurité (`X-Content-Type-Options`, `X-Frame-Options`,
  `X-XSS-Protection`, `Referrer-Policy`) appliqués sur toutes les réponses API.

---

## Problèmes fréquents

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Permission denied` sur `storage/logs/laravel.log` | Permissions incorrectes sur `storage/`/`bootstrap/cache` | Voir étape 7 du premier démarrage |
| `Route [login] not defined` / erreur 500 inattendue sur une route API | Header `Accept: application/json` manquant dans l'appel | Toujours ajouter `-H "Accept: application/json"` aux appels `curl` |
| Erreur de connexion MySQL au démarrage | Le conteneur `mysql` n'a pas fini son initialisation avant que `backend` ne tente de s'y connecter | Attendre quelques secondes puis relancer, ou `docker compose restart backend` |
| Un changement dans un `Dockerfile` ne semble pas pris en compte | L'image a été relancée sans être reconstruite | Voir [Mettre à jour un projet déjà installé](#mettre-à-jour-un-projet-déjà-installé-pull--rebuild), utiliser `--no-cache` |
| `Permission denied` au moment d'un `git checkout`/`git pull` sur des fichiers backend | Fichiers créés/modifiés depuis l'intérieur du conteneur (appartenant à `root`/`www-data`), non modifiables par l'utilisateur système | `sudo chown -R $USER:$USER backend/` (ou le sous-dossier concerné) avant de relancer la commande Git |
| Page de détail (commande/intervention) ne s'affiche jamais | Le `public_id` contient un `#` non encodé dans l'URL | Vérifier que `encodeURIComponent()` est bien utilisé dans le code front concerné |