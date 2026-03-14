# ============================================
# Makefile - LubriFlow
# ============================================

.PHONY: help install dev build preview clean docker-build docker-run test lint

# Couleurs
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

## Afficher l'aide
help:
	@echo "$(BLUE)LubriFlow - Commandes disponibles:$(NC)"
	@echo ""
	@echo "$(GREEN)Développement:$(NC)"
	@echo "  make install      → Installer les dépendances"
	@echo "  make dev          → Démarrer le serveur de développement"
	@echo "  make build        → Build pour production"
	@echo "  make preview      → Prévisualiser le build"
	@echo ""
	@echo "$(GREEN)Docker:$(NC)"
	@echo "  make docker-build → Build l'image Docker"
	@echo "  make docker-run   → Lancer le conteneur Docker"
	@echo "  make docker-stop  → Arrêter le conteneur Docker"
	@echo ""
	@echo "$(GREEN)Maintenance:$(NC)"
	@echo "  make clean        → Nettoyer les fichiers générés"
	@echo "  make test         → Lancer les tests"
	@echo "  make lint         → Vérifier le code"
	@echo ""

## Installer les dépendances
install:
	@echo "$(BLUE)📦 Installation des dépendances...$(NC)"
	npm install
	@echo "$(GREEN)✅ Installation terminée$(NC)"

## Démarrer le serveur de développement
dev:
	@echo "$(BLUE)🚀 Démarrage du serveur de développement...$(NC)"
	npm run dev

## Build pour production
build:
	@echo "$(BLUE)🔨 Build de l'application...$(NC)"
	npm run build
	@echo "$(GREEN)✅ Build terminé$(NC)"

## Prévisualiser le build
preview:
	@echo "$(BLUE)👁️  Prévisualisation du build...$(NC)"
	npm run preview

## Nettoyer les fichiers générés
clean:
	@echo "$(YELLOW)🧹 Nettoyage des fichiers...$(NC)"
	rm -rf dist node_modules package-lock.json
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

## Build l'image Docker
docker-build:
	@echo "$(BLUE)🐳 Build de l'image Docker...$(NC)"
	docker build -t lubriflow .
	@echo "$(GREEN)✅ Image Docker buildée$(NC)"

## Lancer le conteneur Docker
docker-run:
	@echo "$(BLUE)🐳 Lancement du conteneur Docker...$(NC)"
	docker run -d -p 8080:80 --name lubriflow lubriflow
	@echo "$(GREEN)✅ Conteneur lancé sur http://localhost:8080$(NC)"

## Arrêter le conteneur Docker
docker-stop:
	@echo "$(YELLOW)🛑 Arrêt du conteneur Docker...$(NC)"
	docker stop lubriflow
	docker rm lubriflow
	@echo "$(GREEN)✅ Conteneur arrêté$(NC)"

## Lancer les tests
test:
	@echo "$(BLUE)🧪 Lancement des tests...$(NC)"
	npm test

## Vérifier le code
lint:
	@echo "$(BLUE)🔍 Vérification du code...$(NC)"
	npm run lint

## Réinstallation complète
reinstall: clean install
	@echo "$(GREEN)✅ Réinstallation terminée$(NC)"

## Déploiement rapide
deploy: build
	@echo "$(GREEN)🚀 Application prête pour le déploiement !$(NC)"
	@echo "$(BLUE)Les fichiers sont dans le dossier 'dist/'$(NC)"
