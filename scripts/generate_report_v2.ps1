param(
    [string]$OutputPath = "c:\wamp64\www\fox_petroleum\Rapport_Projet_Fox_Petroleum.docx"
)

# Créer un dossier temporaire pour le contenu DOCX
$tempDir = [System.IO.Path]::GetTempPath() + "docx_temp_" + [System.Guid]::NewGuid().ToString()
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
New-Item -ItemType Directory -Force -Path "$tempDir\word" | Out-Null
New-Item -ItemType Directory -Force -Path "$tempDir\_rels" | Out-Null
New-Item -ItemType Directory -Force -Path "$tempDir\word\_rels" | Out-Null

# Créer [Content_Types].xml
$contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>
'@
Set-Content -Path "$tempDir\[Content_Types].xml" -Value $contentTypes -Encoding UTF8

# Créer _rels/.rels
$rels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
'@
Set-Content -Path "$tempDir\_rels\.rels" -Value $rels -Encoding UTF8

# Créer word/_rels/document.xml.rels
$docRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
'@
Set-Content -Path "$tempDir\word\_rels\document.xml.rels" -Value $docRels -Encoding UTF8

# Créer le document principal (word/document.xml)
$document = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
    <w:body>
        <w:sectPr>
            <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
        </w:sectPr>
    </w:body>
</w:document>
'@

function Add-Paragraph {
    param([string]$text, [string]$style = "Normal", [bool]$bold = $false, [int]$fontSize = 22)
    
    $fontSizeHalf = $fontSize * 2
    $run = ""
    
    if ($bold) {
        $run = "<w:r><w:rPr><w:b/><w:sz w:val='$fontSizeHalf'/></w:rPr><w:t>$($text)</w:t></w:r>"
    } else {
        $run = "<w:r><w:rPr><w:sz w:val='$fontSizeHalf'/></w:rPr><w:t>$($text)</w:t></w:r>"
    }
    
    return "<w:p><w:pPr><w:pStyle w:val='$style'/></w:pPr>$run</w:p>"
}

function Add-PageBreak {
    return "<w:p><w:r><w:br w:type='page'/></w:r></w:p>"
}

# Construire le contenu
$body = ""

# Pages vides (1-3)
$body += Add-Paragraph ""
$body += Add-PageBreak
$body += Add-Paragraph ""
$body += Add-PageBreak
$body += Add-Paragraph ""
$body += Add-PageBreak

# Page 4: Table des matières
$body += Add-Paragraph "TABLE DES MATIERES" "Heading1" $true
$body += Add-Paragraph "2. Contexte Général du Projet"
$body += Add-Paragraph "   2.1 Entreprise d'Accueil"
$body += Add-Paragraph "   2.2 Problématique"
$body += Add-Paragraph "   2.3 Objectifs du Projet"
$body += Add-Paragraph "3. Analyse et Conception"
$body += Add-Paragraph "   3.1 Architecture de l'Application Web"
$body += Add-Paragraph "   3.2 Diagramme de Cas d'Utilisation"
$body += Add-Paragraph "   3.3 Diagramme de Classes"
$body += Add-Paragraph "   3.4 Diagramme de Séquence"
$body += Add-Paragraph "4. Réalisation et Mise en Œuvre"
$body += Add-Paragraph "   4.1 Technologies et Outils de Développement"
$body += Add-PageBreak

# Section 2
$body += Add-Paragraph "2. CONTEXTE GENERAL DU PROJET" "Heading1" $true
$body += Add-Paragraph "2.1 Entreprise d'Accueil" "Heading2" $true
$body += Add-Paragraph "FOX PETROLEUM est une entreprise spécialisée dans le commerce et la distribution de produits pétroliers. L'entreprise opère dans le secteur énergétique et fournit des solutions de distribution aux clients commerciaux et industriels."
$body += Add-Paragraph ""
$body += Add-Paragraph "Domaine d'activité: Distribution de produits énergétiques"
$body += Add-Paragraph "Secteur: Énergie et Réserves"
$body += Add-Paragraph "Type de clientèle: Clients commerciaux, industriels et particuliers"
$body += Add-PageBreak

$body += Add-Paragraph "2.2 Problématique" "Heading2" $true
$body += Add-Paragraph "Avant le démarrage du projet, FOX PETROLEUM rencontrait plusieurs défis opérationnels:"
$body += Add-Paragraph ""
$body += Add-Paragraph "• Gestion manuelle des commandes de produits"
$body += Add-Paragraph "• Absence de système de suivi en temps réel des livraisons"
$body += Add-Paragraph "• Difficulté de gestion des stocks et des inventaires"
$body += Add-Paragraph "• Manque de visibilité sur les performances commerciales"
$body += Add-Paragraph "• Processus de facturation lent et enclin aux erreurs"
$body += Add-Paragraph "• Communication inefficace entre les différents services"
$body += Add-Paragraph "• Performances insuffisantes pour le volume de transactions"
$body += Add-PageBreak

$body += Add-Paragraph "2.3 Objectifs du Projet" "Heading2" $true
$body += Add-Paragraph "L'objectif principal est de développer une application web moderne et performante."
$body += Add-Paragraph ""
$body += Add-Paragraph "Objectifs généraux:"
$body += Add-Paragraph "• Automatiser la gestion des commandes et livraisons"
$body += Add-Paragraph "• Mettre en place un système de suivi en temps réel"
$body += Add-Paragraph "• Optimiser la gestion des stocks"
$body += Add-Paragraph "• Générer des rapports commerciaux détaillés"
$body += Add-Paragraph "• Accélérer le processus de facturation"
$body += Add-Paragraph "• Améliorer les communications inter-services"
$body += Add-Paragraph "• Assurer des performances optimales"
$body += Add-Paragraph "• Réduire les coûts opérationnels de 30%"
$body += Add-Paragraph "• Augmenter la satisfaction des clients"
$body += Add-PageBreak

# Section 3
$body += Add-Paragraph "3. ANALYSE ET CONCEPTION" "Heading1" $true

$body += Add-Paragraph "3.1 Architecture de l'Application Web" "Heading2" $true
$body += Add-Paragraph "L'application Fox Petroleum suit une architecture moderne en trois couches."
$body += Add-Paragraph ""
$body += Add-Paragraph "COUCHE PRESENTATION:"
$body += Add-Paragraph "Frontend: React + TypeScript + Vite (Port 5173)"
$body += Add-Paragraph "• Interface utilisateur responsive"
$body += Add-Paragraph "• Gestion d'état avec React Context"
$body += Add-Paragraph "• Communication via Axios avec JWT"
$body += Add-Paragraph ""
$body += Add-Paragraph "COUCHE APPLICATION:"
$body += Add-Paragraph "Backend: Laravel Framework (PHP 8.4) - Port 8000"
$body += Add-Paragraph "• Contrôleurs API REST"
$body += Add-Paragraph "• Middleware (CORS, Authentification, Validation)"
$body += Add-Paragraph "• Services métier et logique applicative"
$body += Add-Paragraph "• Authentification JWT"
$body += Add-Paragraph ""
$body += Add-Paragraph "COUCHE DONNÉES:"
$body += Add-Paragraph "MySQL 8.0 - Système de gestion de bases de données"
$body += Add-Paragraph "• Modèles de données normalisés"
$body += Add-Paragraph "• Indexes optimisés pour les performances"
$body += Add-Paragraph "• Transactions ACID"
$body += Add-Paragraph ""
$body += Add-Paragraph "INFRASTRUCTURE:"
$body += Add-Paragraph "• Containerisation Docker Compose"
$body += Add-Paragraph "• Services: Frontend, Backend API, MySQL, Nginx"
$body += Add-Paragraph "• Nginx en reverse proxy"
$body += Add-PageBreak

$body += Add-Paragraph "3.2 Diagramme de Cas d'Utilisation" "Heading2" $true
$body += Add-Paragraph "Détail des acteurs et cas d'utilisation:"
$body += Add-Paragraph ""
$body += Add-Paragraph "1. ADMINISTRATEUR"
$body += Add-Paragraph "   • Gérer les utilisateurs (créer, modifier, supprimer)"
$body += Add-Paragraph "   • Gérer les rôles et permissions"
$body += Add-Paragraph "   • Accéder aux rapports globaux et statistiques"
$body += Add-Paragraph "   • Configurer les paramètres système"
$body += Add-Paragraph "   • Gérer les véhicules et les chauffeurs"
$body += Add-Paragraph ""
$body += Add-Paragraph "2. COMMERCIAL (Vendeur)"
$body += Add-Paragraph "   • Créer et gérer les commandes clients"
$body += Add-Paragraph "   • Consulter le catalogue de produits"
$body += Add-Paragraph "   • Appliquer des remises et tarifs spéciaux"
$body += Add-Paragraph "   • Gérer les clients"
$body += Add-Paragraph "   • Consulter les statistiques commerciales"
$body += Add-Paragraph ""
$body += Add-Paragraph "3. CLIENT (Acheteur)"
$body += Add-Paragraph "   • Consulter le catalogue de produits"
$body += Add-Paragraph "   • Passer des commandes"
$body += Add-Paragraph "   • Consulter l'historique des commandes"
$body += Add-Paragraph "   • Suivre l'état de la livraison en temps réel"
$body += Add-Paragraph "   • Consulter les factures"
$body += Add-Paragraph ""
$body += Add-Paragraph "4. CHAUFFEUR/LIVREUR"
$body += Add-Paragraph "   • Consulter les ordres de livraison assignés"
$body += Add-Paragraph "   • Démarrer une livraison"
$body += Add-Paragraph "   • Enregistrer la livraison effectuée"
$body += Add-Paragraph "   • Saisir la signature du client"
$body += Add-Paragraph "   • Rapporter les problèmes de livraison"
$body += Add-Paragraph ""
$body += Add-Paragraph "5. GESTIONNAIRE DE STOCK"
$body += Add-Paragraph "   • Consulter les niveaux de stock en temps réel"
$body += Add-Paragraph "   • Chercher des produits par référence"
$body += Add-Paragraph "   • Générer des alertes de stock faible"
$body += Add-Paragraph "   • Enregistrer les entrées/sorties de stock"
$body += Add-Paragraph "   • Générer des rapports d'inventaire"
$body += Add-PageBreak

$body += Add-Paragraph "3.3 Diagramme de Classes" "Heading2" $true
$body += Add-Paragraph "Structure des entités principales et leurs relations:"
$body += Add-Paragraph ""
$body += Add-Paragraph "ENTITÉS PRINCIPALES:"
$body += Add-Paragraph ""
$body += Add-Paragraph "USERS (Utilisateurs)"
$body += Add-Paragraph "- id: Integer (Primary Key)"
$body += Add-Paragraph "- name: String"
$body += Add-Paragraph "- email: String (unique)"
$body += Add-Paragraph "- password: String (encrypted)"
$body += Add-Paragraph "- phone: String"
$body += Add-Paragraph "- role_id: Integer (Foreign Key -> roles)"
$body += Add-Paragraph "- is_active: Boolean"
$body += Add-Paragraph ""
$body += Add-Paragraph "ORDERS (Commandes)"
$body += Add-Paragraph "- id: Integer"
$body += Add-Paragraph "- order_number: String"
$body += Add-Paragraph "- customer_id: Integer (FK)"
$body += Add-Paragraph "- status: String"
$body += Add-Paragraph "- total_amount: Decimal"
$body += Add-Paragraph "- created_at: Timestamp"
$body += Add-Paragraph ""
$body += Add-Paragraph "ORDER_ITEMS"
$body += Add-Paragraph "- id: Integer"
$body += Add-Paragraph "- order_id: Integer (FK)"
$body += Add-Paragraph "- product_id: Integer (FK)"
$body += Add-Paragraph "- quantity: Integer"
$body += Add-Paragraph "- unit_price: Decimal"
$body += Add-Paragraph ""
$body += Add-Paragraph "PRODUCTS"
$body += Add-Paragraph "- id: Integer"
$body += Add-Paragraph "- name: String"
$body += Add-Paragraph "- price: Decimal"
$body += Add-Paragraph "- stock: Integer"
$body += Add-Paragraph "- min_stock: Integer"
$body += Add-Paragraph ""
$body += Add-Paragraph "DELIVERIES"
$body += Add-Paragraph "- id: Integer"
$body += Add-Paragraph "- order_id: Integer (FK)"
$body += Add-Paragraph "- chauffeur_id: Integer (FK)"
$body += Add-Paragraph "- status: String"
$body += Add-Paragraph "- planned_date: Date"
$body += Add-PageBreak

$body += Add-Paragraph "3.4 Diagramme de Séquence" "Heading2" $true
$body += Add-Paragraph "Flux d'interaction entre les acteurs et le système:"
$body += Add-Paragraph ""
$body += Add-Paragraph "SCÉNARIO 1: CRÉATION D'UNE COMMANDE"
$body += Add-Paragraph ""
$body += Add-Paragraph "Client -----> Commercial -----> Système -----> Database"
$body += Add-Paragraph "  │              │                 │              │"
$body += Add-Paragraph "  │- Demande ------>                │              │"
$body += Add-Paragraph "  │  commande      │                │              │"
$body += Add-Paragraph "  │                │- Valider ----->              │"
$body += Add-Paragraph "  │                │  commande      │              │"
$body += Add-Paragraph "  │                │                │- Créer ----->│"
$body += Add-Paragraph "  │                │                │  commande    │"
$body += Add-Paragraph "  │                │                │<- OK --------│"
$body += Add-Paragraph "  │<- Confirmation-│                │              │"
$body += Add-Paragraph "  │                │<- Success -----│              │"
$body += Add-Paragraph ""
$body += Add-Paragraph "SCÉNARIO 2: LIVRAISON D'UNE COMMANDE"
$body += Add-Paragraph ""
$body += Add-Paragraph "Chauffeur -----> Système -----> Gestionnaire"
$body += Add-Paragraph "  │                │              │"
$body += Add-Paragraph "  │- Demande ----->│              │"
$body += Add-Paragraph "  │  ordres        │              │"
$body += Add-Paragraph "  │<- Liste -------│              │"
$body += Add-Paragraph "  │  ordres        │              │"
$body += Add-Paragraph "  │- Démarrer ---->│              │"
$body += Add-Paragraph "  │  livraison     │- Maj status >│"
$body += Add-Paragraph "  │ [En route]     │              │"
$body += Add-Paragraph "  │- Livraison --->│              │"
$body += Add-Paragraph "  │  effectuée     │- Maj status >│"
$body += Add-PageBreak

# Section 4
$body += Add-Paragraph "4. REALISATION ET MISE EN ŒUVRE" "Heading1" $true

$body += Add-Paragraph "4.1 Technologies et Outils de Développement" "Heading2" $true

$body += Add-Paragraph "4.1.1 FRONTEND" "Heading3" $true
$body += Add-Paragraph "• Framework: React 18+ avec TypeScript"
$body += Add-Paragraph "• Build Tool: Vite (développement rapide, HMR)"
$body += Add-Paragraph "• Routage: React Router v6"
$body += Add-Paragraph "• Gestion d'état: React Context API"
$body += Add-Paragraph "• HTTP Client: Axios"
$body += Add-Paragraph "• Styling: Tailwind CSS + PostCSS"
$body += Add-Paragraph "• Composants UI: Radix UI"
$body += Add-Paragraph "• Notifications: Sonner"
$body += Add-Paragraph "• Icons: Lucide React"
$body += Add-Paragraph "• PDF Export: jsPDF + html2canvas"
$body += Add-Paragraph ""

$body += Add-Paragraph "4.1.2 BACKEND" "Heading3" $true
$body += Add-Paragraph "• Langage: PHP 8.4"
$body += Add-Paragraph "• Framework: Laravel 11"
$body += Add-Paragraph "• Authentification: JWT (tymon/jwt-auth)"
$body += Add-Paragraph "• Validation: Laravel Validator"
$body += Add-Paragraph "• ORM: Eloquent"
$body += Add-Paragraph "• Migration: Laravel Migrations"
$body += Add-Paragraph "• Cache: Redis"
$body += Add-Paragraph "• Logging: Monolog"
$body += Add-Paragraph "• Testing: PHPUnit"
$body += Add-Paragraph ""

$body += Add-Paragraph "4.1.3 BASE DE DONNÉES" "Heading3" $true
$body += Add-Paragraph "• SGBD: MySQL 8.0"
$body += Add-Paragraph "• Design: Schéma relationnel normalisé (3NF)"
$body += Add-Paragraph "• Indexes: Sur clés étrangères et colonnes fréquemment interrogées"
$body += Add-Paragraph "• Transactions: ACID pour l'intégrité"
$body += Add-Paragraph ""

$body += Add-Paragraph "4.1.4 INFRASTRUCTURE ET DÉPLOIEMENT" "Heading3" $true
$body += Add-Paragraph "• Containerisation: Docker et Docker Compose"
$body += Add-Paragraph "• Reverse Proxy: Nginx"
$body += Add-Paragraph "• Web Server: Apache/PHP-FPM"
$body += Add-Paragraph "• Versionning: Git"
$body += Add-Paragraph ""

$body += Add-Paragraph "4.1.5 OUTILS DE DÉVELOPPEMENT" "Heading3" $true
$body += Add-Paragraph "• IDE: Visual Studio Code"
$body += Add-Paragraph "• API Testing: Postman"
$body += Add-Paragraph "• Database Tools: MySQL Workbench"
$body += Add-Paragraph "• Version Control: Git"
$body += Add-Paragraph "• Environnement local: WAMP Stack"

# Créer le fichier styles.xml
$styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:docDefaults>
        <w:rPrDefault>
            <w:rPr>
                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                <w:sz w:val="22"/>
            </w:rPr>
        </w:rPrDefault>
    </w:docDefaults>
    <w:style w:type="paragraph" w:styleId="Normal">
        <w:name w:val="Normal"/>
        <w:qFormat/>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading1">
        <w:name w:val="Heading 1"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:link w:val="Heading1Char"/>
        <w:uiPriority w:val="9"/>
        <w:qFormat/>
        <w:pPr>
            <w:pStyle w:val="Heading1"/>
            <w:keepNext/>
            <w:spacing w:before="240" w:after="60"/>
            <w:outlineLvl w:val="0"/>
        </w:pPr>
        <w:rPr>
            <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
            <w:b/>
            <w:bCs/>
            <w:color w:val="2E75B6"/>
            <w:sz w:val="32"/>
            <w:szCs w:val="32"/>
        </w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading2">
        <w:name w:val="Heading 2"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:link w:val="Heading2Char"/>
        <w:uiPriority w:val="9"/>
        <w:qFormat/>
        <w:pPr>
            <w:pStyle w:val="Heading2"/>
            <w:keepNext/>
            <w:spacing w:before="120" w:after="60"/>
            <w:outlineLvl w:val="1"/>
        </w:pPr>
        <w:rPr>
            <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
            <w:b/>
            <w:bCs/>
            <w:color w:val="44546A"/>
            <w:sz w:val="26"/>
            <w:szCs w:val="26"/>
        </w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading3">
        <w:name w:val="Heading 3"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:link w:val="Heading3Char"/>
        <w:uiPriority w:val="9"/>
        <w:qFormat/>
        <w:pPr>
            <w:pStyle w:val="Heading3"/>
            <w:keepNext/>
            <w:spacing w:before="120" w:after="60"/>
            <w:outlineLvl w:val="2"/>
        </w:pPr>
        <w:rPr>
            <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
            <w:b/>
            <w:bCs/>
            <w:color w:val="666666"/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
        </w:rPr>
    </w:style>
</w:styles>
'@

Set-Content -Path "$tempDir\word\styles.xml" -Value $styles -Encoding UTF8

# Créer le document XML avec tout le contenu
[xml]$xml = Get-Content "$tempDir\word\document.xml"
$xml.document.body.InnerXml = $body
$xml.Save("$tempDir\word\document.xml")

# Créer le fichier DOCX (ZIP)
Remove-Item -Path $OutputPath -Force -ErrorAction SilentlyContinue
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $OutputPath, 'Optimal', $false)

# Nettoyer
Remove-Item -Recurse -Force -Path $tempDir

Write-Host "✅ Rapport généré avec succès!" -ForegroundColor Green
Write-Host "📄 Fichier: $OutputPath" -ForegroundColor Cyan
Write-Host "`nContenu du rapport:" -ForegroundColor Yellow
Write-Host "- Pages 1-3: Vides (à compléter)"
Write-Host "- Page 4: Table des matières"
Write-Host "- Section 2: Contexte général du projet"
Write-Host "- Section 3: Analyse et conception"
Write-Host "- Section 4: Réalisation et mise en œuvre"
