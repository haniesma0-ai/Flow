# Script simplifié pour générer un document Word en DOCX
# Fonctionne avec les anciennes versions de PowerShell

$OutputPath = "c:\wamp64\www\fox_petroleum\Rapport_Projet_Fox_Petroleum.docx"
$tempDir = [System.IO.Path]::GetTempPath() + "docx_temp_" + [System.Guid]::NewGuid().ToString()

try {
    # Créer les dossiers
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    New-Item -ItemType Directory -Force -Path "$tempDir\word" | Out-Null
    New-Item -ItemType Directory -Force -Path "$tempDir\_rels" | Out-Null
    New-Item -ItemType Directory -Force -Path "$tempDir\word\_rels" | Out-Null

    # [Content_Types].xml
    $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'
    [System.IO.File]::WriteAllText("$tempDir\[Content_Types].xml", $contentTypes, [System.Text.Encoding]::UTF8)

    # _rels/.rels
    $rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
    [System.IO.File]::WriteAllText("$tempDir\_rels\.rels", $rels, [System.Text.Encoding]::UTF8)

    # word/_rels/document.xml.rels
    $docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
    [System.IO.File]::WriteAllText("$tempDir\word\_rels\document.xml.rels", $docRels, [System.Text.Encoding]::UTF8)

    # word/styles.xml
    $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="60"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="60"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style></w:styles>'
    [System.IO.File]::WriteAllText("$tempDir\word\styles.xml", $styles, [System.Text.Encoding]::UTF8)

    # Construire le document XML
    $sb = New-Object System.Text.StringBuilder
    $sb.AppendLine('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>') | Out-Null
    $sb.AppendLine('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">') | Out-Null
    $sb.AppendLine('<w:body>') | Out-Null

    # Pages vides
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:pageBreakBefore/><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:pageBreakBefore/><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:pageBreakBefore/><w:r><w:t></w:t></w:r></w:p>') | Out-Null

    # TABLE DES MATIERES
    $sb.AppendLine('<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>TABLE DES MATIERES</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>2. Contexte General du Projet</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   2.1 Entreprise d''Accueil</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   2.2 Problematique</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   2.3 Objectifs du Projet</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>3. Analyse et Conception</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   3.1 Architecture de l''Application Web</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   3.2 Diagramme de Cas d''Utilisation</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   3.3 Diagramme de Classes</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   3.4 Diagramme de Sequence</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>4. Realisation et Mise en Oeuvre</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   4.1 Technologies et Outils de Developpement</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pageBreakBefore/></w:p>') | Out-Null

    # SECTION 2
    $sb.AppendLine('<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>2. CONTEXTE GENERAL DU PROJET</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>2.1 Entreprise d''Accueil</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>FOX PETROLEUM est une entreprise specialisee dans le commerce et la distribution de produits petroliers. L''entreprise opere dans le secteur energetique et fournit des solutions de distribution aux clients commerciaux et industriels.</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>Domaine d''activite: Distribution de produits energetiques</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>Secteur: Energie et Reserves</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>Type de clientele: Clients commerciaux, industriels et particuliers</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pageBreakBefore/></w:p>') | Out-Null
    
    # 2.2 Problématique
    $sb.AppendLine('<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>2.2 Problematique</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>Avant le demarrage du projet, FOX PETROLEUM rencontrait plusieurs defis operationnels:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Gestion manuelle des commandes de produits</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Absence de systeme de suivi en temps reel des livraisons</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Difficulte de gestion des stocks et des inventaires</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Manque de visibilite sur les performances commerciales</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Processus de facturation lent et enclin aux erreurs</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Communication inefficace entre les differents services</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Performances insuffisantes pour le volume de transactions</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pageBreakBefore/></w:p>') | Out-Null

    # 2.3 Objectifs
    $sb.AppendLine('<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>2.3 Objectifs du Projet</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>L''objectif principal est de developper une application web moderne et performante pour optimiser les processus metier de FOX PETROLEUM.</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>Objectifs generaux:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Automatiser la gestion des commandes et livraisons</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Mettre en place un systeme de suivi en temps reel des livraisons</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Optimiser la gestion des stocks et des inventaires</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Generer des rapports et analyses commerciales detaillees</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Accelerer le processus de facturation</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Ameliorer les communications inter-services</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Assurer des performances optimales et une haute disponibilite</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Reduire les couts operationnels de 30%</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Augmenter la satisfaction et la retention des clients</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pageBreakBefore/></w:p>') | Out-Null

    # SECTION 3
    $sb.AppendLine('<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>3. ANALYSE ET CONCEPTION</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>3.1 Architecture de l''Application Web</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>L''application Fox Petroleum suit une architecture moderne en trois couches (frontend - backend - database) avec deploiement sur Docker pour la scalabilite.</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>COUCHE PRESENTATION:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>Frontend: React + TypeScript + Vite (Port 5173)</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Interface utilisateur responsive</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Gestion d''etat avec React Context API</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Communication via Axios avec authentification JWT</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>COUCHE APPLICATION:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>Backend: Laravel Framework (PHP 8.4) - Port 8000</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Controleurs API REST</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Middleware (CORS, Authentification, Validation)</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Services metier et logique applicative</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Authentification JWT</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>COUCHE DONNEES:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>MySQL 8.0 - Systeme de gestion de bases de donnees</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Modeles de donnees normalises</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Indexes optimises pour les performances</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Transactions ACID pour l''integrite des donnees</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pageBreakBefore/></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>3.2 Diagramme de Cas d''Utilisation</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>Detail des acteurs et cas d''utilisation:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>1. ADMINISTRATEUR</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Gerer les utilisateurs (creer, modifier, supprimer)</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Gerer les roles et permissions</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Acceder aux rapports globaux et statistiques</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>2. COMMERCIAL (Vendeur)</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Creer et gerer les commandes clients</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Consulter le catalogue de produits</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Appliquer des remises et tarifs speciaux</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>3. CLIENT (Acheteur)</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Consulter le catalogue de produits</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Passer des commandes</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Consulter l''historique des commandes</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Suivre l''etat de la livraison en temps reel</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>4. CHAUFFEUR/LIVREUR</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Consulter les ordres de livraison assignes</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Demarrer une livraison</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Enregistrer la livraison effectuee</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>5. GESTIONNAIRE DE STOCK</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Consulter les niveaux de stock en temps reel</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Chercher les produits par reference</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>   - Generer des alertes de stock faible</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pageBreakBefore/></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>3.3 Diagramme de Classes</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>Structure des entites principales et leurs relations:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>ENTITES PRINCIPALES:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>USERS: id, name, email, password, phone, role_id, is_active</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>ORDERS: id, order_number, customer_id, status, total_amount, created_at</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>ORDER_ITEMS: id, order_id, product_id, quantity, unit_price</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>PRODUCTS: id, name, price, stock, min_stock, unit</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>DELIVERIES: id, order_id, chauffeur_id, status, planned_date</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>CUSTOMERS: id, name, email, phone, address, city</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>INVOICES: id, order_id, invoice_number, amount, status, due_date</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pageBreakBefore/></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>3.4 Diagramme de Sequence</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>Flux d''interaction entre les acteurs et le systeme</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>SCENARIO 1: CREATION D''UNE COMMANDE</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>Client demande une commande -> Commercial valide -> Systeme cree la commande en base de donnees -> Confirmation envoyee au client</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>SCENARIO 2: LIVRAISON D''UNE COMMANDE</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>Chauffeur recoit ordre -> Demarrage livraison -> En route (GPS) -> Livraison effectuee avec signature -> Status maj en base</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pageBreakBefore/></w:p>') | Out-Null

    # SECTION 4
    $sb.AppendLine('<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>4. REALISATION ET MISE EN OEUVRE</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>4.1 Technologies et Outils de Developpement</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:r><w:t>FRONTEND:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- React 18+ avec TypeScript</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Build Tool: Vite (developpement rapide)</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Routage: React Router v6</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Gestion d''etat: React Context API</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- HTTP Client: Axios</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Styling: Tailwind CSS</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:r><w:t>BACKEND:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- PHP 8.4</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Framework: Laravel 11</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Authentification: JWT</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- ORM: Eloquent</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Cache: Redis</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:r><w:t>BASE DE DONNEES:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- MySQL 8.0</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Schema relationnel normalise (3NF)</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Indexes optimises pour les performances</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Transactions ACID</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:r><w:t>INFRASTRUCTURE ET DEPLOIEMENT:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Containerisation: Docker et Docker Compose</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Reverse Proxy: Nginx</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Web Server: Apache/PHP-FPM</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Version Control: Git</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t></w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('<w:p><w:r><w:t>OUTILS DE DEVELOPPEMENT:</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- IDE: Visual Studio Code</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- API Testing: Postman</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Database Tools: MySQL Workbench</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Version Control: Git</w:t></w:r></w:p>') | Out-Null
    $sb.AppendLine('<w:p><w:r><w:t>- Environnement local: WAMP Stack</w:t></w:r></w:p>') | Out-Null

    $sb.AppendLine('</w:body>') | Out-Null
    $sb.AppendLine('</w:document>') | Out-Null

    # Sauvegarder le document XML
    [System.IO.File]::WriteAllText("$tempDir\word\document.xml", $sb.ToString(), [System.Text.Encoding]::UTF8)

    # Créer le ZIP (DOCX)
    Remove-Item -Path $OutputPath -Force -ErrorAction SilentlyContinue
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $OutputPath, 'Optimal', $false)

    # Nettoyage
    Remove-Item -Recurse -Force -Path $tempDir

    Write-Host "Rapport genere avec succes!" -ForegroundColor Green
    Write-Host "Fichier: $OutputPath" -ForegroundColor Cyan

} catch {
    Write-Host "Erreur: $_" -ForegroundColor Red
}
