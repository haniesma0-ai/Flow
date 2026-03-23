# Script de génération du rapport de projet en format .docx
# Auteur: Générateur automatique
# Date: 2026-03-21

# Installe DocumentFormat.OpenXml si nécessaire
$moduleName = "DocumentFormat.OpenXml"
$assemblyPath = "C:\Program Files\nuget\DocumentFormat.OpenXml\lib\net50\DocumentFormat.OpenXml.dll"

# Utilise Word COM si disponible
try {
    $wordApp = New-Object -ComObject Word.Application
    $wordApp.Visible = $false
    $doc = $wordApp.Documents.Add()
    $selection = $wordApp.Selection
    
    # Paramètres de mise en page
    $section = $doc.Sections(1)
    $section.PageSetup.TopMargin = 72
    $section.PageSetup.BottomMargin = 72
    $section.PageSetup.LeftMargin = 72
    $section.PageSetup.RightMargin = 72
    
    # Fonction pour ajouter du texte avec style
    function Add-Text {
        param(
            [string]$text,
            [string]$style = "Normal",
            [int]$fontSize = 11,
            [bool]$bold = $false,
            [bool]$breakAfter = $true
        )
        $selection.Font.Name = "Calibri"
        $selection.Font.Size = $fontSize
        $selection.Font.Bold = $bold
        $selection.TypeText($text)
        if ($breakAfter) {
            $selection.TypeParagraph()
        }
    }
    
    function Add-Heading {
        param([string]$text, [int]$level = 1)
        if ($level -eq 1) {
            $selection.Font.Size = 26
            $selection.Font.Bold = $true
            $selection.Font.Color = 1526239 # Bleu
        } elseif ($level -eq 2) {
            $selection.Font.Size = 16
            $selection.Font.Bold = $true
            $selection.Font.Color = 3355443 # Gris-bleu
        } else {
            $selection.Font.Size = 14
            $selection.Font.Bold = $true
            $selection.Font.Color = 6710886
        }
        $selection.TypeText($text)
        $selection.Font.Size = 11
        $selection.Font.Bold = $false
        $selection.Font.Color = 0
        $selection.TypeParagraph()
        $selection.TypeParagraph()
    }
    
    # PAGE 1-3: VIDES (à remplir par l'utilisateur)
    Add-Text "" # Page vide 1
    $selection.InsertBreak(7) # Page break
    Add-Text "" # Page vide 2
    $selection.InsertBreak(7) # Page break
    Add-Text "" # Page vide 3
    $selection.InsertBreak(7) # Page break
    
    # PAGE 4: TABLE DES MATIERES
    Add-Heading "TABLE DES MATIERES" 1
    Add-Text "2. Contexte Général du Projet"
    Add-Text "   2.1 Entreprise d'Accueil"
    Add-Text "   2.2 Problématique"
    Add-Text "   2.3 Objectifs du Projet"
    Add-Text "3. Analyse et Conception"
    Add-Text "   3.1 Architecture de l'Application Web"
    Add-Text "   3.2 Diagramme de Cas d'Utilisation"
    Add-Text "   3.3 Diagramme de Classes"
    Add-Text "   3.4 Diagramme de Séquence"
    Add-Text "4. Réalisation et Mise en Œuvre"
    Add-Text "   4.1 Technologies et Outils de Développement"
    
    $selection.InsertBreak(7) # Page break
    
    # SECTION 2: CONTEXTE GENERAL
    Add-Heading "2. CONTEXTE GENERAL DU PROJET" 1
    
    # 2.1 Entreprise d'accueil
    Add-Heading "2.1 Entreprise d'Accueil" 2
    Add-Text "FOX PETROLEUM est une entreprise spécialisée dans le commerce et la distribution de produits pétroliers. L'entreprise opère dans le secteur énergétique et fournit des solutions de distribution aux clients commerciaux et industriels."
    Add-Text ""
    Add-Text "Domaine d'activité: Distribution de produits énergétiques"
    Add-Text "Secteur: Énergie et Réserves"
    Add-Text "Type de clientèle: Clients commerciaux, industriels et particuliers"
    $selection.InsertBreak(7)
    
    # 2.2 Problématique
    Add-Heading "2.2 Problématique" 2
    Add-Text "Avant le démarrage du projet, FOX PETROLEUM rencontrait plusieurs défis opérationnels:"
    Add-Text ""
    Add-Text "• Gestion manuelle des commandes de produits"
    Add-Text "• Absence de système de suivi en temps réel des livraisons"
    Add-Text "• Difficulté de gestion des stocks et des inventaires"
    Add-Text "• Manque de visibilité sur les performances commerciales"
    Add-Text "• Processus de facturation lent et enclin aux erreurs"
    Add-Text "• Communication inefficace entre les différents services (ventes, logistique, facturation)"
    Add-Text "• Performances des applications existantes insuffisantes pour le volume de transactions"
    $selection.InsertBreak(7)
    
    # 2.3 Objectifs
    Add-Heading "2.3 Objectifs du Projet" 2
    Add-Text "L'objectif principal est de développer une application web moderne et performante pour optimiser les processus métier de FOX PETROLEUM."
    Add-Text ""
    Add-Text "Objectifs généraux:"
    Add-Text "• Automatiser la gestion des commandes et livraisons"
    Add-Text "• Mettre en place un système de suivi en temps réel des livraisons"
    Add-Text "• Optimiser la gestion des stocks et des inventaires"
    Add-Text "• Générer des rapports et analyses commerciales détaillées"
    Add-Text "• Accélérer le processus de facturation"
    Add-Text "• Améliorer les communications inter-services"
    Add-Text "• Assurer des performances optimales et une haute disponibilité"
    Add-Text "• Réduire les coûts opérationnels de 30%"
    Add-Text "• Augmenter la satisfaction et la rétention des clients"
    $selection.InsertBreak(7)
    
    # SECTION 3: ANALYSE ET CONCEPTION
    Add-Heading "3. ANALYSE ET CONCEPTION" 1
    
    # 3.1 Architecture
    Add-Heading "3.1 Architecture de l'Application Web" 2
    Add-Text "L'application Fox Petroleum suit une architecture moderne en trois couches (frontend - backend - database) avec déploiement sur Docker pour la scalabilité."
    Add-Text ""
    Add-Text "ARCHITECTURE DE L'APPLICATION:"
    Add-Text ""
    Add-Text "┌─────────────────────────────────────────────────────────────────┐"
    Add-Text "│                     COUCHE PRESENTATION                          │"
    Add-Text "│  Frontend: React + TypeScript + Vite (Port 5173)                │"
    Add-Text "│  • Interface utilisateur responsive                             │"
    Add-Text "│  • Gestion d'état avec React Context/Redux                      │"
    Add-Text "│  • Communication via Axios avec authentification JWT            │"
    Add-Text "└─────────────────────────────────────────────────────────────────┘"
    Add-Text "                              │"
    Add-Text "                    Routes API REST JSON"
    Add-Text "                              │"
    Add-Text "┌─────────────────────────────────────────────────────────────────┐"
    Add-Text "│                   COUCHE APPLICATION (API)                       │"
    Add-Text "│  Backend: Laravel Framework (PHP 8.4) - Port 8000              │"
    Add-Text "│  • Contrôleurs API REST                                         │"
    Add-Text "│  • Middleware (CORS, Authentification, Validation)              │"
    Add-Text "│  • Services métier et logique applicative                        │"
    Add-Text "│  • Authentification JWT (tymon/jwt-auth)                        │"
    Add-Text "│  • Pagination, Filtrage, Tri des données                        │"
    Add-Text "└─────────────────────────────────────────────────────────────────┘"
    Add-Text "                              │"
    Add-Text "                        Requêtes SQL"
    Add-Text "                              │"
    Add-Text "┌─────────────────────────────────────────────────────────────────┐"
    Add-Text "│                    COUCHE DONNÉES (Database)                     │"
    Add-Text "│  MySQL 8.0 - Système de gestion de bases de données             │"
    Add-Text "│  • Modèles de données normalisés                                │"
    Add-Text "│  • Indexes optimisés pour les performances                      │"
    Add-Text "│  • Transactions ACID pour l'intégrité des données               │"
    Add-Text "└─────────────────────────────────────────────────────────────────┘"
    Add-Text ""
    Add-Text "INFRASTRUCTURE D'EXÉCUTION:"
    Add-Text "• Containerisation Docker Compose"
    Add-Text "• Services: Frontend, Backend API, MySQL, Nginx"
    Add-Text "• Nginx en reverse proxy pour load balancing"
    Add-Text "• Cache Redis pour performances optimales"
    $selection.InsertBreak(7)
    
    # 3.2 Diagramme Use Case
    Add-Heading "3.2 Diagramme de Cas d'Utilisation" 2
    Add-Text "Détail des acteurs et cas d'utilisation:"
    Add-Text ""
    Add-Text "ACTEURS IDENTIFIÉS:"
    Add-Text ""
    Add-Text "1. ADMINISTRATEUR"
    Add-Text "   • Gérer les utilisateurs (créer, modifier, supprimer)"
    Add-Text "   • Gérer les rôles et permissions"
    Add-Text "   • Accéder aux rapports globaux et statistiques"
    Add-Text "   • Configurer les paramètres système"
    Add-Text "   • Gérer les véhicules et les chauffeurs"
    Add-Text "   • Consulter les logs d'audit"
    Add-Text ""
    Add-Text "2. COMMERCIAL (Vendeur)"
    Add-Text "   • Créer et gérer les commandes clients"
    Add-Text "   • Consulter le catalogue de produits"
    Add-Text "   • Appliquer des remises et tarifs spéciaux"
    Add-Text "   • Gérer les clients"
    Add-Text "   • Consulter les commandes en cours"
    Add-Text "   • Générer des devis"
    Add-Text "   • Accéder aux statistiques commerciales personnelles"
    Add-Text ""
    Add-Text "3. CLIENT (Acheteur)"
    Add-Text "   • Consulter le catalogue de produits"
    Add-Text "   • Passer des commandes"
    Add-Text "   • Consulter l'historique des commandes"
    Add-Text "   • Suivre l'état de la livraison en temps réel"
    Add-Text "   • Consulter les factures et historique de paiement"
    Add-Text "   • Signaler des problèmes ou réclamations"
    Add-Text ""
    Add-Text "4. CHAUFFEUR/LIVREUR"
    Add-Text "   • Consulter les ordres de livraison assignés"
    Add-Text "   • Démarrer une livraison"
    Add-Text "   • Enregistrer la livraison effectuée"
    Add-Text "   • Saisir la signature du client ou une photo"
    Add-Text "   • Suivre l'itinéraire de livraison optimisé"
    Add-Text "   • Rapporter les problèmes de livraison"
    Add-Text ""
    Add-Text "5. GESTIONNAIRE DE STOCK"
    Add-Text "   • Consulter les niveaux de stock en temps réel"
    Add-Text "   • Chercher des produits par référence"
    Add-Text "   • Générer des alertes de stock faible"
    Add-Text "   • Enregistrer les entrées/sorties de stock"
    Add-Text "   • Gérer les emplacements de stockage"
    Add-Text "   • Générer des rapports d'inventaire"
    Add-Text ""
    Add-Text "DIAGRAMME USE CASE (Structure textuelle):"
    Add-Text ""
    Add-Text "                    ┌─────────────────────────────────┐"
    Add-Text "                    │      SYSTÈME FOX PETROLEUM      │"
    Add-Text "                    └─────────────────────────────────┘"
    Add-Text "                              △"
    Add-Text "                   ┌──────────┼──────────┬──────────┐"
    Add-Text "             ┌─────┴────┐  ┌─┴────┐  ┌──┴──┐  ┌─────┴────┐"
    Add-Text "             │ Admin    │  │Client│  │Chauf│  │Gestionnaire"
    Add-Text "             │          │  │      │  │feur │  │   Stock  │"
    Add-Text "             └──────────┘  └──────┘  └─────┘  └──────────┘"
    Add-Text "                   │           │        │           │"
    Add-Text "         ┌─────────┼───────────┼────────┼───────────┤"
    Add-Text "         │         │           │        │           │"
    Add-Text "    Créer      Passer    Suivre liv  Récup       Gérer"
    Add-Text "    Commandes  Commande  Temps réel Ordres      Stocks"
    $selection.InsertBreak(7)
    
    # 3.3 Diagramme de Classes
    Add-Heading "3.3 Diagramme de Classes" 2
    Add-Text "Structure des entités principales et leurs relations:"
    Add-Text ""
    Add-Text "ENTITÉS PRINCIPALES:"
    Add-Text ""
    Add-Text "╔════════════════════════════════════════════════════════════════╗"
    Add-Text "║                        USERS (Utilisateurs)                    ║"
    Add-Text "╠════════════════════════════════════════════════════════════════╣"
    Add-Text "║ - id: Integer (PK)                                             ║"
    Add-Text "║ - name: String                                                 ║"
    Add-Text "║ - email: String (unique)                                       ║"
    Add-Text "║ - password: String (encrypted)                                 ║"
    Add-Text "║ - phone: String                                                ║"
    Add-Text "║ - role_id: Integer (FK -> roles)                               ║"
    Add-Text "║ - is_active: Boolean                                           ║"
    Add-Text "║ - created_at: Timestamp                                        ║"
    Add-Text "║ - updated_at: Timestamp                                        ║"
    Add-Text "╰════════════════════════════════════════════════════════════════╝"
    Add-Text "                     1                          *"
    Add-Text "                 ┌───────────────────────────────┐"
    Add-Text "                 │"
    Add-Text "      ┌──────────────┐"
    Add-Text "      │ CUSTOMERS    │ ◄──────┐"
    Add-Text "      └──────────────┘        │"
    Add-Text "             │                │"
    Add-Text "             │ 1          * │ 1"
    Add-Text "             │                │"
    Add-Text "      ┌──────▼──────────┐  ┌──┴──────────┐"
    Add-Text "      │    ORDERS       │──┤   DELIVERIES│"
    Add-Text "      │                 │  └─────────────┘"
    Add-Text "      │ - id            │        │"
    Add-Text "      │ - order_number  │        │ 1"
    Add-Text "      │ - customer_id   │        │"
    Add-Text "      │ - status        │        │ * (items livraison)"
    Add-Text "      │ - total_amount  │        │"
    Add-Text "      │ - created_at    │   ┌────▼─────────┐"
    Add-Text "      └────┬────────────┘   │ DELIVERY_ITEMS│"
    Add-Text "           │ 1              └───────────────┘"
    Add-Text "           │ *"
    Add-Text "      ┌────▼────────────┐"
    Add-Text "      │  ORDER_ITEMS    │──────┐"
    Add-Text "      │                 │      │"
    Add-Text "      │ - id            │      │ 1"
    Add-Text "      │ - order_id (FK) │      │"
    Add-Text "      │ - product_id    │  ┌───┴──────────┐"
    Add-Text "      │ - quantity      │  │  PRODUCTS    │"
    Add-Text "      │ - unit_price    │  │              │"
    Add-Text "      └─────────────────┘  │ - id         │"
    Add-Text "                           │ - name       │"
    Add-Text "      ┌─────────────────┐  │ - price      │"
    Add-Text "      │ INVOICES        │  │ - stock      │"
    Add-Text "      │                 │  └──────────────┘"
    Add-Text "      │ - id            │"
    Add-Text "      │ - order_id (FK) │"
    Add-Text "      │ - invoice_num   │"
    Add-Text "      │ - amount        │"
    Add-Text "      │ - status        │"
    Add-Text "      └─────────────────┘"
    $selection.InsertBreak(7)
    
    # 3.4 Diagramme de Séquence
    Add-Heading "3.4 Diagramme de Séquence" 2
    Add-Text "Flux d'interaction entre les acteurs et le système:"
    Add-Text ""
    Add-Text "SCÉNARIO 1: CRÉATION D'UNE COMMANDE"
    Add-Text ""
    Add-Text "Client          Commercial        Système        Database"
    Add-Text "   │                │                │               │"
    Add-Text "   │── Demande ──────>                │               │"
    Add-Text "   │   commande      │                │               │"
    Add-Text "   │                 │- Valider ─────>               │"
    Add-Text "   │                 │  commande      │               │"
    Add-Text "   │                 │                │─ Créer ─────>│"
    Add-Text "   │                 │                │  commande    │"
    Add-Text "   │                 │                │<─ OK ────────│"
    Add-Text "   │<─ Confirmation ─┤                │               │"
    Add-Text "   │                 │<─ Success ─────│               │"
    Add-Text ""
    Add-Text "SCÉNARIO 2: LIVRAISON D'UNE COMMANDE"
    Add-Text ""
    Add-Text "Chauffeur      Système        Gestionnaire    GPS/Route"
    Add-Text "   │              │                │             │"
    Add-Text "   │─ Demande ────>                │             │"
    Add-Text "   │   ordres      │                │             │"
    Add-Text "   │<─ Liste ──────│                │             │"
    Add-Text "   │   ordres      │                │             │"
    Add-Text "   │─ Démarrer ───>│                │             │"
    Add-Text "   │   livraison   │─ Maj status ──>             │"
    Add-Text "   │               │                │             │"
    Add-Text "   │ [En route]    │<─ GPS ────────────────────>│"
    Add-Text "   │               │   route       │             │"
    Add-Text "   │─ Livraison ──>│                │             │"
    Add-Text "   │   effectuée   │─ Maj status ──>             │"
    Add-Text "   │<─ Signature ──│                │             │"
    Add-Text "   │   client      │                │             │"
    $selection.InsertBreak(7)
    
    # SECTION 4: REALISATION ET MISE EN OEUVRE
    Add-Heading "4. REALISATION ET MISE EN ŒUVRE" 1
    
    # 4.1 Technologies et outils
    Add-Heading "4.1 Technologies et Outils de Développement" 2
    
    Add-Heading "4.1.1 FRONTEND" 3
    Add-Text "• Framework: React 18+ avec TypeScript"
    Add-Text "• Build Tool: Vite (développement rapide, HMR)"
    Add-Text "• Routage: React Router v6"
    Add-Text "• Gestion d'état: React Context API + propTypes"
    Add-Text "• HTTP Client: Axios (requêtes API)"
    Add-Text "• Styling: Tailwind CSS + PostCSS"
    Add-Text "• Composants UI: Radix UI (accessibilité)"
    Add-Text "• Notifications: Sonner (toast notifications)"
    Add-Text "• Icons: Lucide React"
    Add-Text "• Documentation: ESLint + Prettier"
    Add-Text "• PDF Export: jsPDF + html2canvas"
    Add-Text ""
    
    Add-Heading "4.1.2 BACKEND" 3
    Add-Text "• Langage: PHP 8.4"
    Add-Text "• Framework: Laravel 11 (framework complet)"
    Add-Text "• Authentification: JWT (tymon/jwt-auth)"
    Add-Text "• Validation: Laravel Validator (règles métier)"
    Add-Text "• ORM: Eloquent (abstraction base de données)"
    Add-Text "• Migration: Laravel Migrations (versioning DB)"
    Add-Text "• Cache: Redis (performances, sessions)"
    Add-Text "• Logging: Monolog (gestion des logs)"
    Add-Text "• Testing: PHPUnit"
    Add-Text "• Pagination: Intégrée (Laravel)"
    Add-Text "• Documentation: API largement commentée"
    Add-Text ""
    
    Add-Heading "4.1.3 BASE DE DONNÉES" 3
    Add-Text "• SGBD: MySQL 8.0"
    Add-Text "• Design: Schéma relationnel normalisé (3NF)"
    Add-Text "• Indexes: Sur clés étrangères et colonnes fréquemment interrogées"
    Add-Text "• Transactions: ACID pour l'intégrité des données"
    Add-Text "• Backup: Sauvegardes automatiques"
    Add-Text ""
    
    Add-Heading "4.1.4 INFRASTRUCTURE & DÉPLOIEMENT" 3
    Add-Text "• Containerisation: Docker & Docker Compose"
    Add-Text "• Reverse Proxy: Nginx (load balancing, SSL/TLS)"
    Add-Text "• Web Server: Apache/PHP-FPM"
    Add-Text "• Versionning: Git (GitHub/GitLab)"
    Add-Text "• CI/CD: Intégration continue (optionnel)"
    Add-Text "• Monitoring: Logs centralisés"
    Add-Text ""
    
    Add-Heading "4.1.5 OUTILS DE DÉVELOPPEMENT" 3
    Add-Text "• IDE: Visual Studio Code"
    Add-Text "• API Testing: Postman / REST Client"
    Add-Text "• Database Tools: MySQL Workbench / DBeaver"
    Add-Text "• Version Control: Git + GitHub Desktop"
    Add-Text "• Documentation: Laravel Artisan CLI"
    Add-Text "• Environnement local: WAMP Stack (Windows + Apache + MySQL + PHP)"
    Add-Text ""
    
    Add-Heading "4.1.6 MATRICE DE COMPATIBILITÉ" 3
    Add-Text "┌─────────────────────┬──────────────────────┐"
    Add-Text "│ Navigateurs         │ Versions supportées  │"
    Add-Text "├─────────────────────┼──────────────────────┤"
    Add-Text "│ Chrome              │ 90+                  │"
    Add-Text "│ Firefox             │ 88+                  │"
    Add-Text "│ Safari              │ 14+                  │"
    Add-Text "│ Edge                │ 90+                  │"
    Add-Text "└─────────────────────┴──────────────────────┘"
    Add-Text ""
    Add-Text "┌─────────────────────┬──────────────────────┐"
    Add-Text "│ Système d'exploitation │ Support            │"
    Add-Text "├─────────────────────┼──────────────────────┤"
    Add-Text "│ Windows 10/11       │ Complet              │"
    Add-Text "│ macOS 11+           │ Complet              │"
    Add-Text "│ Linux (Ubuntu 20+)  │ Complet              │"
    Add-Text "└─────────────────────┴──────────────────────┘"
    
    # Sauvegarder le document
    $reportPath = "c:\wamp64\www\fox_petroleum\Rapport_Projet_Fox_Petroleum.docx"
    $doc.SaveAs($reportPath)
    Write-Host "✅ Rapport généré avec succès: $reportPath" -ForegroundColor Green
    
    # Fermer Word
    $wordApp.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($wordApp) | Out-Null
    
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    Write-Host "Assurez-vous que Microsoft Word est installé sur le système." -ForegroundColor Yellow
}
