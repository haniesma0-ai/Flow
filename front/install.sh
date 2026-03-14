#!/bin/bash

# ============================================
# Script d'installation rapide - LubriFlow
# ============================================

echo "🚀 Installation de LubriFlow..."
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    echo "📥 Téléchargez Node.js 18+ depuis : https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ requise (actuel: $(node --version))${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) détecté${NC}"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm --version) détecté${NC}"
echo ""

# Installation des dépendances
echo -e "${BLUE}📦 Installation des dépendances...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Échec de l'installation des dépendances${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dépendances installées avec succès${NC}"
echo ""

# Copier le fichier .env.example
echo -e "${BLUE}⚙️  Configuration de l'environnement...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Fichier .env créé${NC}"
else
    echo -e "${BLUE}ℹ️  Fichier .env existe déjà${NC}"
fi
echo ""

# Build de l'application
echo -e "${BLUE}🔨 Build de l'application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Échec du build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build réussi${NC}"
echo ""

# Message de fin
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Installation terminée avec succès !${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📋 Commandes disponibles :"
echo ""
echo "  npm run dev       → Démarrer en mode développement"
echo "  npm run build     → Build pour production"
echo "  npm run preview   → Prévisualiser le build"
echo ""
echo "🌐 L'application sera accessible sur http://localhost:5173"
echo ""
echo "🔑 Identifiants de démo :"
echo "  Admin      : admin@lubriflow.com / password"
echo "  Commercial : commercial@lubriflow.com / password"
echo "  Chauffeur  : chauffeur@lubriflow.com / password"
echo ""

# Demander si on démarre le serveur
read -p "🚀 Démarrer le serveur de développement maintenant ? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${BLUE}🚀 Démarrage du serveur...${NC}"
    npm run dev
fi
