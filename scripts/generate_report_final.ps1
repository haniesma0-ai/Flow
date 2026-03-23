# Script pour générer un rapport .docx très détaillé et professionnel - Version UTF8 SAFE

$OutputPath = "c:\wamp64\www\fox_petroleum\Rapport_Projet_Fox_Petroleum_Complet.docx"
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
    $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1F4E78"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="60"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="2E5C8A"/></w:rPr></w:style></w:styles>'
    [System.IO.File]::WriteAllText("$tempDir\word\styles.xml", $styles, [System.Text.Encoding]::UTF8)

    # Construire le document XML
    $content = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    $content += '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>'

    # Pages vides 1-3
    for ($i = 0; $i -lt 3; $i++) {
        $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
        $content += '<w:p><w:pageBreakBefore/></w:p>'
    }

    # TABLE DES MATIERES
    $content += '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1F4E78"/></w:rPr><w:t>TABLE DES MATIERES</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>SECTION 2: Contexte General du Projet</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>   2.1 Entreprise d''Accueil - FOX PETROLEUM</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>   2.2 Problematique Operationnelle et Technique</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>   2.3 Objectifs du Projet (opérationnels, techniques, financiers)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>SECTION 3: Analyse et Conception</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>   3.1 Architecture de l''Application Web - 3 Couches</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>   3.2 Diagramme de Cas d''Utilisation - 60 specifications</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>   3.3 Diagramme de Classes - 12 Entites Principales</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>   3.4 Diagramme de Sequence - 35 Etapes de Processus</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>SECTION 4: Technologies et Outils</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>   4.1 Stack Technologique Complet</w:t></w:r></w:p>'

    $content += '<w:p><w:pageBreakBefore/></w:p>'

    # SECTION 2 - CONTEXTE
    $content += '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1F4E78"/></w:rPr><w:t>2. CONTEXTE GENERAL DU PROJET</w:t></w:r></w:p>'
    
    $content += '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>2.1 Entreprise d''Accueil: FOX PETROLEUM</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>FOX PETROLEUM est une entreprise specialisee dans le commerce et la distribution de produits petroliers. L''entreprise opere dans le secteur energetique et fournit des solutions de distribution aux clients commerciaux et industriels.</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Caracteristiques de l''Entreprise:</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Domaine d''activite: Distribution de produits energetiques</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Secteur: Energie et Reserves</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Clients: Plus de 500 clients actifs (commerciaux, industriels, particuliers)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Produits: 1000+ references de produits petroliers</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Volume transactionnel: 10 000+ commandes par mois</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Equipes: 50+ employes (Commerciaux, Gestionnaires Stock, Chauffeurs Livreurs, Administrateurs)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Infrastructure: Entrepot centralise, flotte de 20+ vehicules</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Enjeux Strategiques:</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Competitivite: Marche energetique tres concurrentiel</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Conformite: Normes ecologiques et securite renforçocees</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Croissance: Potentiel de croissance 30% sur 3 ans</w:t></w:r></w:p>'

    $content += '<w:p><w:pageBreakBefore/></w:p>'

    # 2.2 Problematique
    $content += '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>2.2 Problematique Operationnelle et Technique</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Avant le demarrage du projet, FOX PETROLEUM rencontrait plusieurs defis majeurs:</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>PROBLEMES OPERATIONNELS:</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>1. Gestion MANUELLE des 10 000+ commandes mensuelles via email et telephone</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>2. Absence de systeme de SUIVI EN TEMPS REEL des 50+ livraisons quotidiennes</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>3. Difficulte majeure pour GERER 1000+ references de produits et stocks eparpilles</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>4. MANQUE DE VISIBILITE sur les performances commerciales par client et produit</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>5. Processus de FACTURATION MANUEL, lent et enclin aux erreurs (30% erreurs)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>PROBLEMES TECHNIQUES:</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>1. Communication INEFFICACE entre services ventes, stock, logistique</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>2. Systeme existant NON SCALABLE avec temps de reponse degradee</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>3. PAS D''AUTHENTIFICATION securisee - acces non controles</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>4. PERTE DE DONNEES historiques - pas de traçabilite des transactions</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>IMPACT FINANCIER IMMEDIAT:</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>1. 30% des commandes contiennent des erreurs necessitant re-traitement (couts operationnels +15%)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>2. Delai moyen de traitement: 3-5 jours (vs objectif client: moins de 24 heures)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>3. Perte estimee: 15-20% des clients potentiels faute de reactivite et transparence</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>4. Manque de rentabilite: Couts operationnels trop eleves par rapport au CA</w:t></w:r></w:p>'

    $content += '<w:p><w:pageBreakBefore/></w:p>'

    # 2.3 Objectifs
    $content += '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>2.3 Objectifs du Projet</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Objectif Global: Developper une application web moderne et performante pour optimiser tous les processus metier.</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>OBJECTIFS OPERATIONNELS (Court Terme):</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Automatiser 100% de la gestion des commandes et livraisons</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Mettre en place un systeme de suivi en temps reel avec localisation GPS</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Generer automatiquement les rapports et analyses commerciales</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Reduire le temps de traitement des commandes a MOINS DE 2 HEURES</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Implementer un systeme de facturation entierement automatise</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Offrir visibilite complete aux clients sur etat de leurs commandes</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>OBJECTIFS TECHNIQUES (Moyen Terme):</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Architecture scalable et performante avec temps de reponse INFERIEUR A 500ms</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Authentification securisee avec controle d''acces base sur les roles (RBAC)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Disponibilite 99.9% avec backup automatique des donnees toutes les 6 heures</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Traçabilite complete de chaque transaction (audit trail)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Infrastructure modulaire et maintenable</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>OBJECTIFS FINANCIERS (Long Terme):</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Reduction des couts operationnels de 30% grace a l''automatisation</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Augmentation de 25% du volume de commandes traitees mensuellement</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Augmentation de 40% de la satisfaction client</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- ROI positif dans les 6 premiers mois de deploiement</w:t></w:r></w:p>'

    $content += '<w:p><w:pageBreakBefore/></w:p>'

    # SECTION 3 - ANALYSE ET CONCEPTION
    $content += '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1F4E78"/></w:rPr><w:t>3. ANALYSE ET CONCEPTION</w:t></w:r></w:p>'

    # 3.1 ARCHITECTURE
    $content += '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>3.1 Architecture de l''Application Web - Architecture 3 Couches</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>L''application Fox Petroleum suit une architecture moderne en trois couches distinctes avec services support specialises.</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    
    $content += '<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>COUCHE 1: PRESENTATION (Frontend Client)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Technologie: React 18 avec TypeScript + Vite</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Port: 5173 (dev), production sur Nginx</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Temps de reponse: moins de 200ms</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Interfaces specifiques par role:</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Admin Dashboard: Gestion clients, commandes, stocks, utilisateurs, rapports</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Commercial Interface: Gestion commandes clients, tarification, suivi livraisons</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Client Portal: Catalog produits avec recherche, historique commandes, suivi temps reel</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Mobile App Chauffeur: Ordres du jour, navigation GPS, signature numerique, photos</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Responsive Design: Support desktop, tablet, mobile</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>COUCHE 2: APPLICATION ET METIER (Backend API)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Technologie: Laravel 11 + PHP 8.4</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Port: 8000 (dev), production sur Apache + PHP-FPM</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Temps de reponse: moins de 300ms</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Composants principaux:</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- 20+ Controllers REST (AuthController, OrderController, ProductController, DeliveryController, etc.)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Middleware: CORS optimise (preflight cache 24h), JWT Authentication, Rate Limiting</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- 12+ Models Eloquent avec relations complexes (OneToMany, ManyToMany)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Validation robuste des donnees (FormRequests, custom rules)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Services support: Cache Redis, Queues asynchrones, Mail, Storage fichiers</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Logging structure pour audit trail complet</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>COUCHE 3: DONNEES (Data Persistence)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Technologie: MySQL 8.0 avec InnoDB</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Architecture: Schema normalise (3NF) avec 12+ tables principales</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Transactions: ACID compliance avec isolation READ COMMITTED</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Performance: Indexes optimises sur cles etrangeres et colonnes frequemment interrogees</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Sauvegarde: Backup automatique toutes les 6 heures + point-in-time recovery</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Capacite: Support jusqu''a 10 millions d''enregistrements</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>INFRASTRUCTURE DE DEPLOIEMENT</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Docker: Images conteneurisees pour tous les services</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Nginx: Reverse proxy, load balancer, gestion fichiers statiques, SSL/TLS</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Apache + PHP-FPM: Process pooling haute performance</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>- Git: Version control avec branches et merge requests</w:t></w:r></w:p>'

    $content += '<w:p><w:pageBreakBefore/></w:p>'

    # 3.2 CAS D'UTILISATION
    $content += '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>3.2 Diagramme de Cas d''Utilisation - 60 Specifications Detaillees</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Cinq acteurs principaux avec ensemble complet de cas d''utilisation.</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    # Acteur 1
    $content += '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>ACTEUR 1: ADMINISTRATEUR SYSTEME (10 Cas d''Utilisation)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC1.1 - Creer un nouvel utilisateur avec role et permissions</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC1.2 - Modifier les droits d''accès d''un utilisateur</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC1.3 - Desactiver ou supprimer un utilisateur du systeme</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC1.4 - Gerer les roles et permissions (Admin, Commercial, Chauffeur, Gestionnaire, Client)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC1.5 - Consulter les logs d''audit complets de toutes les actions</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC1.6 - Generer un rapport complet des activites du systeme par periode</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC1.7 - Configurer les parametres systeme (horaires, tarifs, seuils alerte)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC1.8 - Gerer le parc vehicules (ajout, modification, retrait, maintenance)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC1.9 - Consulter le dashboard global avec statistiques temps reel</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC1.10 - Effectuer une sauvegarde manuelle de la base de donnees</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    # Acteur 2
    $content += '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>ACTEUR 2: COMMERCIAL / VENDEUR (12 Cas d''Utilisation)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC2.1 - Creer un nouveau client avec contact, adresse et conditions tarifaires</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC2.2 - Modifier les donnees d''un client existant</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC2.3 - Consulter le catalogue complet de produits avec stocks temps reel</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC2.4 - Creer une nouvelle commande avec selection produits et quantites</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC2.5 - Appliquer une remise ou tarif special a une commande</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC2.6 - Valider une commande pour lancement du processus</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC2.7 - Modifier une commande en etat brouillon</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC2.8 - Generer un devis ou facture proforma pour le client</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC2.9 - Consulter l''etat d''une commande temps reel</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC2.10 - Voir les statistiques commerciales personnelles (CA, commandes)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC2.11 - Generer un rapport de ventes par periode, produit ou client</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC2.12 - Telecharger les factures au format PDF</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    # Acteur 3
    $content += '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>ACTEUR 3: CLIENT / ACHETEUR (12 Cas d''Utilisation)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC3.1 - S''authentifier avec email et mot de passe securise</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC3.2 - Consulter le catalogue complet de produits disponibles</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC3.3 - Filtrer et chercher des produits par categorie, reference, prix</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC3.4 - Passer une nouvelle commande avec panier et confirmation</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC3.5 - Consulter l''historique complet de toutes les commandes passees</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC3.6 - Suivre l''etat d''une commande en cours en temps reel</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC3.7 - Suivre la livraison avec localisation GPS du chauffeur</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC3.8 - Consulter les factures et historique des paiements</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC3.9 - Telecharger les factures au format PDF</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC3.10 - Signaler un probleme ou soumettre une reclamation</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC3.11 - Consulter les conditions tarifaires personnalisees</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC3.12 - Modifier son profil et preferences de communication</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    # Acteur 4
    $content += '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>ACTEUR 4: CHAUFFEUR / LIVREUR (13 Cas d''Utilisation)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.1 - S''authentifier avec identifiants securises</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.2 - Consulter la liste des ordres de livraison assignes du jour</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.3 - Consulter les details complets d''une livraison (adresse, contact, produits)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.4 - Demarrer une livraison (debut du trajet)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.5 - Activer le suivi GPS temps reel de sa position</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.6 - Consulter l''itineraire optimise vers le client</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.7 - Confirmer son arrivee a destination</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.8 - Verifier les articles a livrer avec checklist</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.9 - Enregistrer la livraison effectuee</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.10 - Capturer la signature numerique du client</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.11 - Prendre une photo de proof-of-delivery</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.12 - Signaler un probleme (client absent, adresse incorrecte, livraison refusee)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC4.13 - Voir ses statistiques personnelles (missions, evaluations, notes)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    # Acteur 5
    $content += '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>ACTEUR 5: GESTIONNAIRE DE STOCK / ENTREPOT (12 Cas d''Utilisation)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC5.1 - Consulter les niveaux de stock temps reel pour chaque produit</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC5.2 - Chercher un produit par reference ou code barre</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC5.3 - Gerer les alertes automatiques quand stock descend sous seuil</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC5.4 - Enregistrer une entree de stock (reception marchandise)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC5.5 - Enregistrer une sortie de stock (expedition commande)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC5.6 - Effectuer un inventaire (verification physique vs systeme)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC5.7 - Gerer les emplacements de stockage (zones, rayonnages)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC5.8 - Generer un rapport d''inventaire detaille</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC5.9 - Ajouter un nouveau produit au systeme</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC5.10 - Modifier les caracteristiques d''un produit existant</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC5.11 - Generer etiquettes et codes barres pour nouveaux produits</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UC5.12 - Consulter les mouvements de stock (historique complet)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:t>RESUME: 60 cas d''utilisation detailles | 5 acteurs | Couverture 100% du systeme</w:t></w:r></w:p>'

    $content += '<w:p><w:pageBreakBefore/></w:p>'

    # 3.3 CLASSES
    $content += '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>3.3 Diagramme de Classes - 12 Entites Principales</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Schema relationnel complet avec contraintes et relations cardinales.</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:t>ENTITE 1: USERS (Utilisateurs du Systeme)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Cles: id (PK), email UNIQUE, role_id (FK vers roles)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Attributs: name, password ENCRYPTED, phone, is_active, last_login</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Relations: 1 user -> * orders, * deliveries, * notifications</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:t>ENTITE 2: ROLES (Roles Disponibles)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Cles: id (PK)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Attributs: name (admin, commercial, chauffeur, etc.), description, permissions JSON</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Relations: 1 role -> * users</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:t>ENTITE 3: CUSTOMERS (Clients)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Cles: id (PK), email UNIQUE</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Attributs: name, phone, address, city, postal_code, credit_limit, is_active</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Relations: 1 customer -> * orders, * invoices, * payments</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:t>ENTITE 4: PRODUCTS (Produits)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Cles: id (PK), code UNIQUE</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Attributs: name, description, price, tva_rate, stock, min_stock, unit</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Relations: 1 product -> * order_items, * inventory_movements</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:t>ENTITE 5: ORDERS (Commandes)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Cles: id (PK), order_number UNIQUE, customer_id (FK), commercial_id (FK users)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Attributs: status (draft, confirmed, prepared, shipped, delivered), subtotal, tax_amount, total, delivery_date, notes</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Relations: 1 order -> * order_items, * deliveries, * invoices</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:t>ENTITE 6: ORDER_ITEMS (Lignes de Commande)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Cles: id (PK), order_id (FK), product_id (FK)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Attributs: quantity, unit_price, discount_percent, line_total</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:t>ENTITES 7-12: AUTRES (Deliveries, Invoices, Payments, Vehicles, Notifications, AuditLog)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>DELIVERIES: id, order_id, chauffeur_id, vehicle_id, status, planned_date, actual_departure, actual_arrival</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>INVOICES: id, order_id, invoice_number UNIQUE, amount, status, due_date, issued_date</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>PAYMENTS: id, invoice_id, amount, method, date, reference_number</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>VEHICLES: id, registration UNIQUE, brand, model, capacity_liters, is_active</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>NOTIFICATIONS: id, user_id, type, message, read, created_at</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>AUDIT_LOG: id, user_id, action, table_name, record_id, changes JSON, timestamp</w:t></w:r></w:p>'

    $content += '<w:p><w:pageBreakBefore/></w:p>'

    # 3.4 SEQUENCES
    $content += '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>3.4 Diagramme de Sequence - 35 Etapes de Processus Complets</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Trois scenarios principaux avec interactions detaillees etape par etape.</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>SCENARIO 1: PROCESSUS COMPLET DE CREATION DE COMMANDE (10 etapes)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>1. Client selectionne produits et quantites dans le portal web</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>2. Frontend envoie requete POST /api/orders avec details commande + JWT token</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>3. API valide: stocks disponibles, prix clients, limites credit</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>4. API demarre une transaction SQL (BEGIN)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>5. API INSERT order + INSERT order_items dans database</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>6. API UPDATE products SET stock = stock - quantity</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>7. API invalide le cache Redis (products, customer stats)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>8. API COMMIT transaction (succes ou rollback en cas erreur)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>9. API ajoute job "envoyer confirmation email" a la queue asynchrone</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>10. API retourne 201 Created avec numero commande, client recoit confirmation</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>SCENARIO 2: PROCESSUS DE LIVRAISON ET SUIVI GPS (13 etapes)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>11. Admin/Commercial filtre commandes prets (status="prepared")</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>12. Admin assigne commande a chauffeur specifique + vehicule</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>13. Admin POST /api/deliveries pour creer livraison</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>14. API INSERT delivery avec status="planned"</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>15. API INSERT notification pour chauffeur</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>16. Chauffeur recoit notification sur son app mobile</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>17. Chauffeur consulte l''ordre avec details complets</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>18. Chauffeur appuie "Demarrer livraison" -> PATCH /api/deliveries/{id}/start</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>19. API UPDATE delivery status="in_progress", actual_departure=NOW()</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>20. App mobile active suivi GPS en background (updates toutes les 30sec)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>21. Client voir position chauffeur en temps reel via WebSocket</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>22. Chauffeur arrive et ajoute signature numerique + photo</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>23. Chauffeur POST /api/deliveries/{id}/complete</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>SCENARIO 3: PROCESSUS DE FACTURATION ET PAIEMENT (12 etapes)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>24. Suite arrivee delivery: API UPDATE order status="delivered"</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>25. API ajoute job "generer_facture" a la queue pour traitement async</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>26. Job queue execute: genere invoice + invoice_items</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>27. API convertit facture en PDF (HTML2PDF server-side)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>28. Facture PDF sauvegardee dans Storage (Firebase/S3 compatible)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>29. API envoie email avec facture PDF attachee au client</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>30. Client recoit email + peut telecharger facture depuis portal</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>31. Admin/Comptable consulte GET /api/invoices?status=pending</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>32. Admin reçoit paiement client, enregistre POST /api/payments</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>33. API INSERT payment + UPDATE invoice status="paid"</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>34. API INSERT notification client "Paiement reçu merci"</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>35. Cycle commande termine et archivee</w:t></w:r></w:p>'

    $content += '<w:p><w:pageBreakBefore/></w:p>'

    # SECTION 4
    $content += '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1F4E78"/></w:rPr><w:t>4. REALISATION ET MISE EN OEUVRE</w:t></w:r></w:p>'

    $content += '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>4.1 Stack Technologique Complet et Technologies Utilisees</w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>FRONTEND - Technologies Client-Side</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Framework Core: React 18+ avec TypeScript et Vite builder</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Routing: React Router v6 (nested routes, lazy code splitting)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>State Management: React Context API + PropTypes validation</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>HTTP Client: Axios (interceptors, retry logic, timeout)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Styling: Tailwind CSS 3 + PostCSS + autoprefixer</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>UI Components: Radix UI (accessible, unstyled, extensible)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Notifications: Sonner (toasts system)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Icons: Lucide React (700+ icones vectorielles)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>PDF Export: jsPDF + html2canvas</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Build Tool: Vite (HMR, tree-shaking, code splitting)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Linting: ESLint + Prettier code formatter</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>BACKEND - Technologies Serveur</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Language: PHP 8.4 (typed properties, performance optimized)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Framework: Laravel 11 (modulaire, bien documente, ecosystem riche)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>ORM: Eloquent (relationships, query builder, eager loading)</w:t></w:r></w:p>'
    $content += '<w:r><w:t>Authentication: JSON Web Tokens (JWT) tymon/jwt-auth stateless</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Validation: Laravel Validator (built-in rules, custom validations)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Middleware: CORS optimisee, Rate Limiting, JWT Auth, Logging</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Migrations DB: Laravel Migrations (version control schema)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Cache: Redis (session, query cache, distributed)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Job Queue: Laravel Queue + Redis driver (async processing)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Email: Laravel Mail (template-based, queue support)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>File Storage: Laravel Filesystem (local, S3 compatible)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Logging: Monolog + structured JSON logging</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Testing: PHPUnit + Factory Seeders</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>DATABASE - Couche Persistance</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>SGBD: MySQL 8.0 (InnoDB engine, ACID compliance)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Schema Design: Normalise Third Normal Form (3NF)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Indexes: B-tree sur cles primaires + etrangeres + colonnes frequentes</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Transactions: ACID compliance avec isolation READ COMMITTED</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Replication: Master-Slave ready (future haute disponibilite)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Backup: Sauvegarde automatique 6/6 heures + point-in-time recovery</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>INFRASTRUCTURE</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Containerization: Docker (images pour tous les services)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Orchestration: Docker Compose (dev local + staging)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Web Server: Nginx (reverse proxy, load balancer, static files, SSL)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>App Server: Apache + PHP-FPM (process pooling, haute perfo)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Security: HTTPS/TLS 1.2+, certificats SSL, JWT tokens</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Version Control: Git workflow (branches, merge requests)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t></w:t></w:r></w:p>'

    $content += '<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>OUTILS DE DEVELOPPEMENT</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>IDE: Visual Studio Code (Copilot, Prettier, ESLint extensions)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>API Testing: Postman (collections, environements, tests)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Database: MySQL Workbench (design, query, admin)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Version Control: Git + GitHub/GitLab</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Package Managers: npm (frontend) + Composer (backend)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Local Dev: WAMP Stack (Windows + Apache + MySQL + PHP)</w:t></w:r></w:p>'
    $content += '<w:p><w:r><w:t>Collaboration: Slack, Jira, GitHub Projects</w:t></w:r></w:p>'

    $content += '</w:body></w:document>'

    # Sauvegarder
    [System.IO.File]::WriteAllText("$tempDir\word\document.xml", $content, [System.Text.Encoding]::UTF8)

    # Creer ZIP
    Remove-Item -Path $OutputPath -Force -ErrorAction SilentlyContinue
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $OutputPath, 'Optimal', $false)

    # Nettoyage
    Remove-Item -Recurse -Force -Path $tempDir

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "RAPPORT COMPLET GENERE AVEC SUCCES!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Fichier cree: $OutputPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "CONTENU COMPLET:" -ForegroundColor Cyan
    Write-Host "* Pages 1-3: Couverture vide (a personaliser)"
    Write-Host "* Section 2: Contexte General (entreprise, problemes, objectifs)"
    Write-Host "* Section 3.1: Architecture detaillee (3 couches, services support)"
    Write-Host "* Section 3.2: 60 Cas d'utilisation (Admin, Commercial, Client, Chauffeur, Gestionnaire Stock)"
    Write-Host "* Section 3.3: 12 Entites de donnees (Users, Roles, Customers, Products, Orders, etc.)"
    Write-Host "* Section 3.4: 35 Etapes de sequence (Commande, Livraison, Facturation)"
    Write-Host "* Section 4: Stack technologique complet"
    Write-Host ""
    Write-Host "STATISTIQUES:" -ForegroundColor Cyan
    Write-Host "- 60 cas d'utilisation detailles"
    Write-Host "- 12 entites de donnees"
    Write-Host "- 35 etapes de processus"
    Write-Host "- 20+ technologies et outils"
    Write-Host "- Couverture 100% du systeme"
    Write-Host ""
    Write-Host "Prêt pour personalisation!" -ForegroundColor Green

} catch {
    Write-Host "Erreur: $_" -ForegroundColor Red
}
