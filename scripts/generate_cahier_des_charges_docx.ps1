$ErrorActionPreference = 'Stop'

$workspaceRoot = 'C:/wamp64/www/fox_petroleum'
$outputPath = Join-Path $workspaceRoot 'Cahier_des_Charges_Fox_Petroleum.docx'
$tempDir = Join-Path $workspaceRoot '.tmp_cdc_docx'
$zipPath = Join-Path $workspaceRoot 'Cahier_des_Charges_Fox_Petroleum.docx.zip'

if (Test-Path $tempDir) {
    Remove-Item -LiteralPath $tempDir -Recurse -Force
}

New-Item -ItemType Directory -Path $tempDir | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempDir '_rels') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempDir 'word') | Out-Null

$contentTypesXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
'@

$relsXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
'@

Set-Content -LiteralPath (Join-Path $tempDir '[Content_Types].xml') -Value $contentTypesXml -Encoding UTF8
Set-Content -LiteralPath (Join-Path $tempDir '_rels/.rels') -Value $relsXml -Encoding UTF8

function Escape-XmlText {
    param([string]$Text)

    if ($null -eq $Text) {
        return ''
    }

    return [System.Security.SecurityElement]::Escape($Text)
}

function New-ParagraphXml {
    param(
        [string]$Text,
        [string]$Type = 'p'
    )

    if ($Type -eq 'blank') {
        return '<w:p/>'
    }

    if ($Type -eq 'pagebreak') {
        return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
    }

    $escaped = Escape-XmlText -Text $Text

    switch ($Type) {
        'h1' {
            return '<w:p><w:r><w:rPr><w:b/><w:sz w:val="38"/><w:szCs w:val="38"/></w:rPr><w:t xml:space="preserve">' + $escaped + '</w:t></w:r></w:p>'
        }
        'h2' {
            return '<w:p><w:r><w:rPr><w:b/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr><w:t xml:space="preserve">' + $escaped + '</w:t></w:r></w:p>'
        }
        'h3' {
            return '<w:p><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t xml:space="preserve">' + $escaped + '</w:t></w:r></w:p>'
        }
        default {
            return '<w:p><w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">' + $escaped + '</w:t></w:r></w:p>'
        }
    }
}

$today = Get-Date -Format 'dd/MM/yyyy'

$sections = @(
    @{ type = 'h1'; text = 'CAHIER DES CHARGES - FOX PETROLEUM' },
    @{ type = 'p'; text = 'Version : 1.0 (compatible avec le projet existant Laravel + React/Vite)' },
    @{ type = 'p'; text = "Date : $today" },
    @{ type = 'p'; text = 'Document de reference fonctionnel et technique' },
    @{ type = 'blank'; text = '' },
    @{ type = 'p'; text = 'Client / Organisation : Fox Petroleum' },
    @{ type = 'p'; text = 'Perimetre : Site public + plateforme metier (commandes, livraisons, facturation, suivi GPS, administration)' },
    @{ type = 'pagebreak'; text = '' },

    @{ type = 'h2'; text = '1. Objet du document' },
    @{ type = 'p'; text = 'Ce cahier des charges formalise les besoins metier, fonctionnels, techniques et organisationnels du systeme Fox Petroleum.' },
    @{ type = 'p'; text = 'Il est redige pour etre directement compatible avec la base de code existante (backend Laravel 12, frontend React/TypeScript sous Vite, base MySQL, Docker).' },
    @{ type = 'p'; text = 'Le document sert de reference pour : cadrage, evolutions produit, recette, maintenance, transfert de connaissance et conduite de projet.' },

    @{ type = 'h2'; text = '2. Contexte et enjeux' },
    @{ type = 'p'; text = 'Fox Petroleum opere dans la distribution de lubrifiants et souhaite une plateforme unifiee pour piloter la chaine commerciale et logistique.' },
    @{ type = 'p'; text = 'Le systeme doit couvrir les flux suivants : acquisition client, gestion du catalogue, prise de commande, preparation/livraison, encaissement, facturation, suivi de performance.' },
    @{ type = 'p'; text = 'Un enjeu critique est la tracabilite de la livraison et de l encaissement cash (COD) avec preuves numeriques et piste d audit.' },

    @{ type = 'h2'; text = '3. Objectifs du projet' },
    @{ type = 'p'; text = '- Centraliser toutes les operations commerciales et logistiques dans une plateforme unique.' },
    @{ type = 'p'; text = '- Garantir une gestion multi-roles stricte (admin, manager, commercial, chauffeur, client).' },
    @{ type = 'p'; text = '- Digitaliser la livraison avec geolocalisation, preuve de paiement, signature client et reconciliation de caisse.' },
    @{ type = 'p'; text = '- Automatiser les notifications metier et les tableaux de bord pour le pilotage quotidien.' },
    @{ type = 'p'; text = '- Assurer une base technique maintenable, containerisable et evolutive.' },

    @{ type = 'h2'; text = '4. Perimetre fonctionnel' },
    @{ type = 'h3'; text = '4.1 Perimetre inclus (MVP+)'} ,
    @{ type = 'p'; text = '- Site public : page d accueil, actualites, mentions legales, politique de confidentialite, CGU, offres d emploi, contact.' },
    @{ type = 'p'; text = '- Authentification JWT : inscription client, connexion, deconnexion, profil, changement mot de passe.' },
    @{ type = 'p'; text = '- Dashboards par role : administration, commercial, chauffeur, client.' },
    @{ type = 'p'; text = '- Gestion Produits : CRUD, stock, seuil mini, TVA, activation/desactivation.' },
    @{ type = 'p'; text = '- Gestion Clients : CRUD, infos fiscales (ICE/RC), plafond credit, activation.' },
    @{ type = 'p'; text = '- Gestion Commandes : creation, edition, statuts, lignes produit, calculs TTC, recherche/filtres.' },
    @{ type = 'p'; text = '- Portail Client : consultation catalogue, creation de commandes propres, historique personnel.' },
    @{ type = 'p'; text = '- Gestion Livraisons : planification, affectation chauffeur/vehicule, suivi statuts et positions GPS.' },
    @{ type = 'p'; text = '- Processus COD : confirmation encaissement, ecarts, signature numerique, verrouillage des donnees, synthese et verification de caisse.' },
    @{ type = 'p'; text = '- Facturation : generation facture, statut, paiements partiels/complets, synchronisation commande/facture.' },
    @{ type = 'p'; text = '- Taches/Kanban : taches operationnelles liees aux commandes et utilisateurs.' },
    @{ type = 'p'; text = '- Notifications internes : lecture, marquage, suppression, compteur non lu.' },
    @{ type = 'p'; text = '- Administration : utilisateurs, roles, vehicules, offres d emploi.' },
    @{ type = 'p'; text = '- Internationalisation front : francais, anglais, arabe (gestion du RTL pour arabe).' },

    @{ type = 'h3'; text = '4.2 Hors perimetre actuel (a planifier en evolutions)' },
    @{ type = 'p'; text = '- Paiement en ligne via passerelle bancaire externe.' },
    @{ type = 'p'; text = '- Application mobile native dediee (iOS/Android).' },
    @{ type = 'p'; text = '- Moteur d optimisation d itineraire avance.' },
    @{ type = 'p'; text = '- Workflow complet de recrutement (candidatures, scoring, entretien).' },
    @{ type = 'p'; text = '- Mode hors ligne transactionnel complet avec file de synchronisation robuste (actuellement indicateur offline cote UI).' },

    @{ type = 'h2'; text = '5. Parties prenantes' },
    @{ type = 'p'; text = '- Direction / Sponsor : valide orientations, budget, priorites.' },
    @{ type = 'p'; text = '- Product Owner : arbitre backlog, redacte regles metier et criteres d acceptation.' },
    @{ type = 'p'; text = '- Equipe technique : developpement backend/frontend, QA, DevOps, maintenance.' },
    @{ type = 'p'; text = '- Utilisateurs metier : admin, manager, commercial, chauffeur, client final.' },

    @{ type = 'h2'; text = '6. Roles et droits attendus' },
    @{ type = 'p'; text = '- Admin : acces complet, gestion des utilisateurs, vehicules, offres, suivi global et verification cash.' },
    @{ type = 'p'; text = '- Manager : supervision operationnelle, acces etendu similaire admin hors administration sensible.' },
    @{ type = 'p'; text = '- Commercial : gestion commandes/clients/produits/factures/livraisons, suivi portefeuille.' },
    @{ type = 'p'; text = '- Chauffeur : consultation livraisons assignees, mise a jour GPS/statut, encaissement, signature, synthese de caisse.' },
    @{ type = 'p'; text = '- Client : consultation catalogue et commandes personnelles, creation de commande client, gestion profil.' },

    @{ type = 'h2'; text = '7. Exigences fonctionnelles detaillees' },
    @{ type = 'h3'; text = '7.1 Authentification et profil (EF-AUTH)' },
    @{ type = 'p'; text = '- EF-AUTH-001 : le systeme doit permettre la connexion via email + mot de passe et retourner un token JWT valide.' },
    @{ type = 'p'; text = '- EF-AUTH-002 : l inscription publique doit creer uniquement des comptes role client.' },
    @{ type = 'p'; text = '- EF-AUTH-003 : un compte desactive ne doit pas pouvoir se connecter.' },
    @{ type = 'p'; text = '- EF-AUTH-004 : tout utilisateur authentifie peut consulter et modifier son profil.' },
    @{ type = 'p'; text = '- EF-AUTH-005 : changement de mot de passe soumis a verification de l ancien mot de passe.' },

    @{ type = 'h3'; text = '7.2 Produits et stock (EF-PROD)' },
    @{ type = 'p'; text = '- EF-PROD-001 : CRUD complet produit avec code unique, prix, TVA, unite, stock et stock mini.' },
    @{ type = 'p'; text = '- EF-PROD-002 : filtrage par actif/inactif et recherche par nom/code.' },
    @{ type = 'p'; text = '- EF-PROD-003 : detection des produits en stock faible (stock <= min_stock).' },
    @{ type = 'p'; text = '- EF-PROD-004 : suppression interdite si le produit est utilise dans des commandes.' },

    @{ type = 'h3'; text = '7.3 Clients (EF-CLT)' },
    @{ type = 'p'; text = '- EF-CLT-001 : CRUD client avec donnees de contact et donnees fiscales.' },
    @{ type = 'p'; text = '- EF-CLT-002 : recherche multi-critere (code, nom, email).' },
    @{ type = 'p'; text = '- EF-CLT-003 : suppression interdite si le client a des commandes associees.' },

    @{ type = 'h3'; text = '7.4 Commandes (EF-ORD)' },
    @{ type = 'p'; text = '- EF-ORD-001 : creation de commande avec generation automatique de numero unique (ORD-YYYY-XXXX).' },
    @{ type = 'p'; text = '- EF-ORD-002 : calcul automatique sous-total, TVA totale et total TTC depuis les lignes de commande.' },
    @{ type = 'p'; text = '- EF-ORD-003 : statuts supportes : draft, confirmed, preparation, delivery, delivered, cancelled.' },
    @{ type = 'p'; text = '- EF-ORD-004 : passage au statut delivery doit pouvoir declencher une livraison planifiee automatiquement (si ressources disponibles).' },
    @{ type = 'p'; text = '- EF-ORD-005 : suppression autorisee uniquement en statut draft.' },
    @{ type = 'p'; text = '- EF-ORD-006 : notifications automatiques selon les changements de statut et parties prenantes concernees.' },

    @{ type = 'h3'; text = '7.5 Commandes client (EF-CLIENT-ORD)' },
    @{ type = 'p'; text = '- EF-CORD-001 : le client doit voir uniquement ses propres commandes (liaison email user/client).' },
    @{ type = 'p'; text = '- EF-CORD-002 : le client peut creer une commande depuis le catalogue produit.' },
    @{ type = 'p'; text = '- EF-CORD-003 : si fiche client absente, creation automatique d une fiche Customer minimale.' },

    @{ type = 'h3'; text = '7.6 Livraisons et COD (EF-DEL)' },
    @{ type = 'p'; text = '- EF-DEL-001 : CRUD livraison avec affectation commande/chauffeur/vehicule + date planifiee.' },
    @{ type = 'p'; text = '- EF-DEL-002 : statuts supportes : planned, in_progress, completed, cancelled.' },
    @{ type = 'p'; text = '- EF-DEL-003 : un chauffeur ne voit que ses livraisons, admin/manager voient toutes.' },
    @{ type = 'p'; text = '- EF-DEL-004 : completion interdite tant que paiement COD non confirme et signature numerique non capturee.' },
    @{ type = 'p'; text = '- EF-DEL-005 : enregistrement geolocalise des mises a jour de statut et de paiement (lat/lng + historique JSON).' },
    @{ type = 'p'; text = '- EF-DEL-006 : detection d ecart de caisse (montant attendu vs montant encaisse) avec creation d incident.' },
    @{ type = 'p'; text = '- EF-DEL-007 : verrouillage des donnees de paiement apres finalisation de livraison.' },
    @{ type = 'p'; text = '- EF-DEL-008 : soumission de synthese de caisse par chauffeur et verification par admin/manager.' },
    @{ type = 'p'; text = '- EF-DEL-009 : suivi temps reel des chauffeurs en cours de livraison.' },
    @{ type = 'p'; text = '- EF-DEL-010 : ecriture des journaux d audit sur actions critiques (creation, statut, paiement, signature, verification).' },

    @{ type = 'h3'; text = '7.7 Facturation et paiements (EF-INV)' },
    @{ type = 'p'; text = '- EF-INV-001 : generation numero facture unique (INV-YYYY-XXXX).' },
    @{ type = 'p'; text = '- EF-INV-002 : creation manuelle ou synchronisation automatique des factures manquantes depuis commandes.' },
    @{ type = 'p'; text = '- EF-INV-003 : statuts supportes : pending, paid, overdue, cancelled.' },
    @{ type = 'p'; text = '- EF-INV-004 : enregistrement des paiements partiels (cash, virement, cheque, carte).' },
    @{ type = 'p'; text = '- EF-INV-005 : mise a jour automatique du montant paye et passage paid quand le total est couvert.' },
    @{ type = 'p'; text = '- EF-INV-006 : suppression facture autorisee uniquement si statut pending.' },

    @{ type = 'h3'; text = '7.8 Taches, notifications, administration (EF-OPS)' },
    @{ type = 'p'; text = '- EF-OPS-001 : gestion de taches (todo/in_progress/done/cancelled) et priorites (low/medium/high/urgent).' },
    @{ type = 'p'; text = '- EF-OPS-002 : notifications utilisateur (liste, non-lu, marquage, suppression, purge).' },
    @{ type = 'p'; text = '- EF-OPS-003 : gestion des utilisateurs et affectation des roles par admin.' },
    @{ type = 'p'; text = '- EF-OPS-004 : gestion flotte vehicules avec contraintes de suppression (si livraison associee).' },
    @{ type = 'p'; text = '- EF-OPS-005 : gestion des offres d emploi (publique + administration).' },

    @{ type = 'h2'; text = '8. Exigences non fonctionnelles' },
    @{ type = 'p'; text = '- ENF-SEC-001 : securite API via JWT, controles d acces par role, validation serveur de toutes les entrees.' },
    @{ type = 'p'; text = '- ENF-SEC-002 : mots de passe haches; acces API protege par token; invalidation token a la deconnexion.' },
    @{ type = 'p'; text = '- ENF-PERF-001 : objectif de reponse API < 2 secondes sur 95% des operations courantes (hors traitements lourds).' },
    @{ type = 'p'; text = '- ENF-DISP-001 : architecture deployable en conteneurs (backend, frontend, mysql) avec redemarrage automatique.' },
    @{ type = 'p'; text = '- ENF-TRACE-001 : journalisation metier des operations critiques de livraison/caisse (audit_logs).' },
    @{ type = 'p'; text = '- ENF-I18N-001 : application front multilingue FR/EN/AR avec bascule dynamique LTR/RTL.' },
    @{ type = 'p'; text = '- ENF-UX-001 : interface responsive desktop/mobile pour tous les parcours principaux.' },

    @{ type = 'h2'; text = '9. Architecture technique cible (compatible existant)' },
    @{ type = 'p'; text = '- Backend : Laravel 12, PHP 8.2, JWT Auth, API REST JSON.' },
    @{ type = 'p'; text = '- Frontend : React 19, TypeScript, Vite, TailwindCSS, React Router, Axios.' },
    @{ type = 'p'; text = '- Base de donnees : MySQL 8 (migrations Laravel, seeders).' },
    @{ type = 'p'; text = '- Cartographie : Leaflet + geolocation navigateur pour suivi GPS.' },
    @{ type = 'p'; text = '- Notification interne : table notifications + endpoints dedies.' },
    @{ type = 'p'; text = '- Conteneurisation : Dockerfiles backend/frontend + docker-compose full stack.' },

    @{ type = 'h2'; text = '10. Donnees metier principales' },
    @{ type = 'p'; text = '- Utilisateurs/Roles : user, role, activation.' },
    @{ type = 'p'; text = '- Produits : code, nom, prix, tva_rate, stock, min_stock, unit.' },
    @{ type = 'p'; text = '- Clients : code, identite, contact, ICE, RC, credit_limit.' },
    @{ type = 'p'; text = '- Commandes : order_number, client, commercial, totaux, statut, date livraison.' },
    @{ type = 'p'; text = '- Lignes commande : produit, quantite, prix, TVA, total ligne.' },
    @{ type = 'p'; text = '- Livraisons : chauffeur, vehicule, statut, GPS, COD, signature, incident, verification cash.' },
    @{ type = 'p'; text = '- Factures/Paiements : invoice_number, montants, statut, echeance, details paiement.' },
    @{ type = 'p'; text = '- Taches : statut, priorite, createur, assigne, echeance.' },
    @{ type = 'p'; text = '- Notifications : type, titre, message, lien, etat lu/non lu.' },
    @{ type = 'p'; text = '- Audit logs : action, modele, avant/apres, user, contexte requete.' },

    @{ type = 'h2'; text = '11. Interfaces API (resume)' },
    @{ type = 'p'; text = '- Auth : /api/auth/login, /api/auth/register, /api/auth/logout, /api/auth/me, /api/auth/profile, /api/auth/password.' },
    @{ type = 'p'; text = '- Stats : /api/stats/dashboard, /api/stats/sales, /api/stats/products.' },
    @{ type = 'p'; text = '- CRUD : /api/products, /api/customers, /api/orders, /api/deliveries, /api/invoices, /api/tasks.' },
    @{ type = 'p'; text = '- Flux livraison : /api/deliveries/{id}/status, confirm-payment, capture-signature, update-location, cash-summary, verify-cash, track-drivers.' },
    @{ type = 'p'; text = '- Client : /api/client/products, /api/client/orders.' },
    @{ type = 'p'; text = '- Notifications : /api/notifications + unread-count + marquage.' },
    @{ type = 'p'; text = '- Admin : /api/admin/users, /api/admin/vehicles, /api/admin/careers.' },
    @{ type = 'p'; text = '- Public : /api/contact, /api/careers/public.' },

    @{ type = 'h2'; text = '12. Regles de gestion critiques' },
    @{ type = 'p'; text = '- Une commande non draft ne peut pas etre supprimee.' },
    @{ type = 'p'; text = '- Un produit/client lie a des transactions ne peut pas etre supprime librement.' },
    @{ type = 'p'; text = '- Une livraison ne peut passer completed sans paiement confirme + signature numerique.' },
    @{ type = 'p'; text = '- Les donnees de paiement livraison sont verrouillees apres completion.' },
    @{ type = 'p'; text = '- Une facture pending peut recevoir des paiements partiels et devient paid si soldee.' },
    @{ type = 'p'; text = '- Les notifications doivent informer les bons roles/utilisateurs lors d evenements metier.' },

    @{ type = 'h2'; text = '13. Exigences UX et interfaces' },
    @{ type = 'p'; text = '- Parcours role-based avec redirection automatique selon le role apres connexion.' },
    @{ type = 'p'; text = '- Ecrans metier principaux : dashboard, commandes, clients, produits, livraisons, factures, taches, tracking, settings.' },
    @{ type = 'p'; text = '- Parcours client dedie : catalogue, mes commandes, profil.' },
    @{ type = 'p'; text = '- Carte de suivi: affichage des chauffeurs actifs et livraisons en cours avec rafraichissement periodique.' },
    @{ type = 'p'; text = '- Retour utilisateur systematique (toasts succes/erreur/warning).' },

    @{ type = 'h2'; text = '14. Environnements et exploitation' },
    @{ type = 'p'; text = '- Environnement local backend : PHP/Laravel + MySQL.' },
    @{ type = 'p'; text = '- Environnement local frontend : Node.js + Vite (port 5173).' },
    @{ type = 'p'; text = '- Stack Docker cible : backend (8000), frontend (8080), mysql (3307 expose).' },
    @{ type = 'p'; text = '- Variables sensibles : APP_KEY, JWT_SECRET, credentials DB, SMTP.' },
    @{ type = 'p'; text = '- Strategie de sauvegarde a definir : dump DB journalier + retention + restauration testee.' },

    @{ type = 'h2'; text = '15. Qualite, tests et recette' },
    @{ type = 'p'; text = '- Etat actuel : socle de tests present mais couverture fonctionnelle faible (tests exemples).' },
    @{ type = 'p'; text = '- Exigence QA-001 : mettre en place tests API critiques (auth, commandes, livraisons COD, factures).' },
    @{ type = 'p'; text = '- Exigence QA-002 : tests front de parcours principaux par role.' },
    @{ type = 'p'; text = '- Exigence QA-003 : scenarios de recette metier avec jeux de donnees representatifs.' },

    @{ type = 'h2'; text = '16. Planning de mise en oeuvre recommande' },
    @{ type = 'p'; text = 'Lot 1 (S1-S2) : Stabilisation socle securite et donnees (roles, validations, coherence seeders/migrations).' },
    @{ type = 'p'; text = 'Lot 2 (S3-S4) : Renforcement flux commandes/livraisons/facturation + tests API critiques.' },
    @{ type = 'p'; text = 'Lot 3 (S5) : Consolidation suivi GPS/COD et dashboard KPI.' },
    @{ type = 'p'; text = 'Lot 4 (S6) : Recette finale, documentation, preparation de mise en production.' },

    @{ type = 'h2'; text = '17. Livrables attendus' },
    @{ type = 'p'; text = '- Code source backend/frontend versionne.' },
    @{ type = 'p'; text = '- Base de donnees migree + seeders operationnels.' },
    @{ type = 'p'; text = '- Environnement Docker operationnel.' },
    @{ type = 'p'; text = '- Documentation API et guide d exploitation.' },
    @{ type = 'p'; text = '- Plan de tests et PV de recette.' },
    @{ type = 'p'; text = '- Ce cahier des charges versionne (format .docx).' },

    @{ type = 'h2'; text = '18. Risques identifies et plans de mitigation' },
    @{ type = 'p'; text = '- Risque R1 : incoherence role user/client dans certains parcours. Mitigation : harmoniser role unique client ou alias explicite.' },
    @{ type = 'p'; text = '- Risque R2 : token JWT en localStorage expose aux attaques XSS. Mitigation : hardening front, CSP, revue securite, option cookies HttpOnly en evolution.' },
    @{ type = 'p'; text = '- Risque R3 : faible couverture de tests. Mitigation : prioriser tests de non-regression sur flux critiques.' },
    @{ type = 'p'; text = '- Risque R4 : mode offline partiel. Mitigation : cadrer sprint dedie synchronisation robuste si besoin metier.' },

    @{ type = 'h2'; text = '19. Criteres de validation finale' },
    @{ type = 'p'; text = '- Toutes les exigences critiques EF-AUTH, EF-ORD, EF-DEL, EF-INV sont demontrees en recette.' },
    @{ type = 'p'; text = '- Les droits par role sont verifies sur les ecrans et endpoints API.' },
    @{ type = 'p'; text = '- Le flux livraison COD complet (paiement + signature + verrouillage + verification cash) est valide de bout en bout.' },
    @{ type = 'p'; text = '- Les KPI dashboard se chargent sans erreur sur les roles concernes.' },
    @{ type = 'p'; text = '- Le deploiement Docker fonctionne selon les ports et configurations cibles.' },

    @{ type = 'h2'; text = '20. Annexes (trace de compatibilite projet)' },
    @{ type = 'p'; text = '- Backend : Laravel 12, PHP 8.2, JWT Auth, routes API rolees.' },
    @{ type = 'p'; text = '- Frontend : React 19, TypeScript, Vite, i18n FR/EN/AR, cartes Leaflet.' },
    @{ type = 'p'; text = '- Modules code source alignes : Auth, Orders, ClientOrders, Deliveries COD, Invoices, Tasks, Notifications, Dashboard, AdminUsers, Vehicles, Careers, Contact.' },
    @{ type = 'p'; text = '- Base metier alignee : users, roles, products, customers, orders, order_items, deliveries, invoices, payments, tasks, notifications, audit_logs, contact_messages, careers.' },

    @{ type = 'h2'; text = '21. Processus geolocalisation (en bas du document)' },
    @{ type = 'p'; text = '- Etape 1 (chauffeur/front) : au demarrage d une livraison, le navigateur demande l autorisation GPS puis active un suivi continu (watchPosition) et des lectures ponctuelles (getCurrentPosition).' },
    @{ type = 'p'; text = '- Etape 2 (emission) : la position courante (latitude, longitude, precision, horodatage) est envoyee periodiquement vers l API /api/deliveries/{id}/update-location.' },
    @{ type = 'p'; text = '- Etape 3 (controle serveur) : l API verifie les bornes geographiques (lat -90..90, lng -180..180) et controle que le chauffeur est bien assigne a la livraison.' },
    @{ type = 'p'; text = '- Etape 4 (persistance) : la livraison est mise a jour avec latitude/longitude courantes et un evenement est ajoute dans gps_tracking_log (event=location_update, timestamp ISO).' },
    @{ type = 'p'; text = '- Etape 5 (suivi admin) : les roles admin/manager consomment /api/deliveries/track-drivers pour afficher les chauffeurs actifs, leur position courante et leurs livraisons in_progress sur carte.' },
    @{ type = 'p'; text = '- Etape 6 (rafraichissement) : la carte de tracking front se rafraichit automatiquement (intervalle 15s) avec option de refresh manuel.' },
    @{ type = 'p'; text = '- Etape 7 (audit et conformite) : les coordonnees GPS sont historisees avec les evenements metier (statut, paiement, signature) pour assurer tracabilite et justification operationnelle.' },

    @{ type = 'blank'; text = '' },
    @{ type = 'p'; text = 'Fin du document - Cahier des charges Fox Petroleum.' }
)

$paragraphs = New-Object System.Collections.Generic.List[string]
foreach ($section in $sections) {
    $paragraphs.Add((New-ParagraphXml -Text $section.text -Type $section.type))
}

$bodyXml = [string]::Join("`n", $paragraphs)

$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
$bodyXml
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

Set-Content -LiteralPath (Join-Path $tempDir 'word/document.xml') -Value $documentXml -Encoding UTF8

if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}
if (Test-Path $outputPath) {
    Remove-Item -LiteralPath $outputPath -Force
}

Compress-Archive -Path (Join-Path $tempDir '*') -DestinationPath $zipPath -Force
Rename-Item -LiteralPath $zipPath -NewName (Split-Path -Leaf $outputPath)

Remove-Item -LiteralPath $tempDir -Recurse -Force
Write-Output "DOCX generated: $outputPath"
