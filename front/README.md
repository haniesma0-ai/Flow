# foxpetroleum - Système de Gestion pour Distribution de Lubrifiants

![foxpetroleum](https://img.shields.io/badge/foxpetroleum-v1.0.0-blue)
![React](https://img.shields.io/badge/React-18.0+-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?logo=tailwindcss)

Application web complète pour la gestion d'une entreprise de distribution et transport de lubrifiants (huiles, mazout, produits automobiles).

## 🌐 Démo en ligne

**URL de production :** https://6kd5zhyqhi6ok.ok.kimi.link

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [API Backend](#api-backend)
- [Déploiement](#déploiement)
- [Technologies](#technologies)

## 🔧 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** >= 18.0.0 ([Télécharger](https://nodejs.org/))
- **npm** >= 9.0.0 (installé avec Node.js)
- **Git** (optionnel, pour cloner le projet)

### Vérification des prérequis

```bash
node --version    # Doit afficher v18.x.x ou supérieur
npm --version     # Doit afficher 9.x.x ou supérieur
```

## 📦 Installation

### 1. Cloner ou extraire le projet

```bash
# Si vous avez un dépôt git
git clone <url-du-repo>
cd app

# Ou si vous avez les fichiers extraits
cd /chemin/vers/app
```

### 2. Installer les dépendances

```bash
npm install
```

Cette commande installe toutes les dépendances listées dans `package.json` :
- React 18+ et React DOM
- React Router DOM v6
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Chart.js / Recharts
- FullCalendar
- Google Maps React
- Et bien d'autres...

### 3. Vérifier l'installation

```bash
npm list
```

## ⚙️ Configuration

### Configuration des variables d'environnement (optionnel)

Créez un fichier `.env` à la racine du projet :

```bash
# API Backend (si vous avez un backend Laravel)
VITE_API_URL=http://localhost:8000/api

# Google Maps API Key (pour le suivi GPS)
VITE_GOOGLE_MAPS_API_KEY=votre_cle_api_google_maps

# Mode développement
VITE_APP_ENV=development
```

> **Note :** Sans la clé Google Maps, la carte affichera un message indiquant qu'elle nécessite une configuration.

## 🚀 Démarrage

### Mode Développement (recommandé pour le développement)

```bash
npm run dev
```

L'application sera accessible à l'adresse : **http://localhost:5173**

Caractéristiques du mode dev :
- Hot Module Replacement (HMR) - rechargement instantané
- Source maps pour le débogage
- Warnings et erreurs détaillés

### Mode Production (build)

```bash
npm run build
```

Cette commande :
- Compile TypeScript
- Bundle et minifie le code
- Optimise les assets
- Génère le dossier `dist/`

### Prévisualisation du build de production

```bash
npm run build
npm run preview
```

Accessible à **http://localhost:4173**

## 📁 Structure du projet

```
app/
├── public/                 # Assets statiques
├── src/
│   ├── components/         # Composants réutilisables
│   │   └── ui/            # Composants shadcn/ui
│   ├── contexts/          # Contextes React (Auth, etc.)
│   ├── data/              # Données mockées
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Layouts de pages
│   ├── pages/             # Pages de l'application
│   │   ├── dashboard/     # Tableaux de bord
│   │   ├── orders/        # Gestion des commandes
│   │   ├── products/      # Gestion des produits
│   │   ├── customers/     # Gestion des clients
│   │   ├── deliveries/    # Gestion des livraisons
│   │   ├── invoices/      # Gestion des factures
│   │   ├── kanban/        # Tableau Kanban
│   │   ├── calendar/      # Planning
│   │   ├── tracking/      # Suivi GPS
│   │   ├── reports/       # Rapports
│   │   └── settings/      # Paramètres
│   ├── types/             # Types TypeScript
│   ├── App.tsx            # Composant principal
│   ├── index.css          # Styles globaux
│   └── main.tsx           # Point d'entrée
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## ✨ Fonctionnalités

### 🏠 Site Vitrine
- Hero section avec animations
- Présentation des services
- Statistiques de l'entreprise
- Témoignages clients
- Formulaire de contact

### 🔐 Authentification Multi-Rôles
| Rôle | Permissions |
|------|-------------|
| **Admin** | Gestion complète, utilisateurs, rapports financiers |
| **Commercial** | Commandes, clients, produits, planning |
| **Chauffeur** | Livraisons assignées, mode hors ligne |

### 📦 Gestion des Commandes
- CRUD complet
- Workflow de statuts : Brouillon → Confirmée → Préparation → Livraison → Livrée
- Calcul automatique TVA
- Génération de factures

### 📊 Tableaux de Bord
- Statistiques en temps réel
- Graphiques de ventes
- Alertes stock critique
- Top produits et clients

### 🎯 Système Kanban
- Pipeline visuel
- Drag & drop
- Validation Admin ↔ Commercial

### 📅 Planning FullCalendar
- Vue mois/semaine/jour
- Glisser-déposer
- Synchronisation des livraisons

### 🗺️ Suivi GPS
- Carte interactive
- Position des chauffeurs
- Itinéraires optimisés

## 🔌 API Backend (Laravel)

Pour connecter un backend Laravel, modifiez le fichier `src/services/api.ts` :

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Endpoints API recommandés

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/orders
POST   /api/orders
GET    /api/orders/{id}
PUT    /api/orders/{id}
DELETE /api/orders/{id}

GET    /api/products
POST   /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}

GET    /api/customers
POST   /api/customers
GET    /api/customers/{id}
PUT    /api/customers/{id}
DELETE /api/customers/{id}

GET    /api/deliveries
POST   /api/deliveries
GET    /api/deliveries/{id}
PUT    /api/deliveries/{id}

GET    /api/stats/dashboard
GET    /api/stats/sales
GET    /api/stats/products
```

## 📱 Mode Hors Ligne (PWA)

Le projet inclut un détecteur de connexion. Pour une PWA complète :

1. Ajoutez un service worker :
```bash
npm install vite-plugin-pwa --save-dev
```

2. Configurez `vite.config.ts` :
```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
}
```

## 🚀 Déploiement

### Déploiement statique (Netlify, Vercel, etc.)

```bash
npm run build
# Uploadez le dossier dist/ sur votre hébergeur
```

### Déploiement avec Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```bash
# Build et run
docker build -t foxpetroleum .
docker run -p 8080:80 foxpetroleum
```

## 🛠️ Technologies utilisées

| Technologie | Version | Usage |
|------------|---------|-------|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Typage statique |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui | latest | Composants UI |
| React Router | 6.x | Routing |
| Recharts | 2.x | Graphiques |
| FullCalendar | 6.x | Calendrier |
| Google Maps React | 2.x | Cartes |
| date-fns | 3.x | Manipulation dates |

## 🔑 Identifiants de démo

Utilisez ces identifiants pour tester l'application :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `admin@foxpetroleum.com` | `password` |
| Commercial | `commercial@foxpetroleum.com` | `password` |
| Chauffeur | `chauffeur@foxpetroleum.com` | `password` |

## 🐛 Dépannage

### Problème : `npm install` échoue
```bash
# Nettoyer le cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Problème : Port déjà utilisé
```bash
# Trouver et tuer le processus
lsof -ti:5173 | xargs kill -9
# Ou utiliser un autre port
npm run dev -- --port 3000
```

### Problème : Erreurs TypeScript
```bash
# Vérifier les types
npx tsc --noEmit
```

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Équipe

Développé avec ❤️ pour foxpetroleum SARL

---

**Besoin d'aide ?** Contactez-nous à support@foxpetroleum.ma
