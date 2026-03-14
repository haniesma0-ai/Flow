import { Link } from 'react-router-dom';
import { ArrowLeft, UserCheck, Target, Clock, Share2, Lock, Fingerprint, Cookie, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicyPage = () => {
    const sections = [
        {
            icon: UserCheck,
            title: 'Collecte des données personnelles',
            content: (
                <>
                    <p className="text-slate-600 leading-relaxed mb-4">
                        FoxPetroleum SARL collecte des données personnelles dans le cadre de ses activités commerciales.
                        Les données collectées peuvent inclure :
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {['Nom et prénom', 'Email professionnel', 'Numéro de téléphone', 'Raison sociale', 'Données de navigation'].map((item, i) => (
                            <span key={i} className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                {item}
                            </span>
                        ))}
                    </div>
                </>
            ),
        },
        {
            icon: Target,
            title: 'Finalités du traitement',
            content: (
                <ul className="space-y-2.5">
                    {[
                        'Gestion des commandes et des livraisons',
                        'Facturation et suivi des paiements',
                        'Communication avec nos clients (devis, informations commerciales)',
                        'Amélioration de nos services',
                        'Respect de nos obligations légales et réglementaires',
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            ),
        },
        {
            icon: Clock,
            title: 'Durée de conservation',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    Les données personnelles sont conservées pendant la durée de la relation commerciale et
                    pendant une durée de <strong className="text-slate-800">5 ans</strong> après la fin de celle-ci, conformément aux obligations légales
                    en matière de comptabilité et de fiscalité.
                </p>
            ),
        },
        {
            icon: Share2,
            title: 'Partage des données',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    FoxPetroleum SARL <strong className="text-slate-800">ne vend ni ne loue</strong> les données personnelles de ses clients à des tiers.
                    Les données peuvent être partagées avec nos prestataires de services (transport, hébergement)
                    dans le strict cadre de l'exécution de nos obligations contractuelles.
                </p>
            ),
        },
        {
            icon: Lock,
            title: 'Sécurité des données',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
                    les données personnelles contre tout accès non autorisé, modification, divulgation ou
                    destruction. Nos systèmes utilisent le <strong className="text-slate-800">chiffrement SSL</strong> et des protocoles de sécurité avancés.
                </p>
            ),
        },
        {
            icon: Fingerprint,
            title: 'Vos droits',
            content: (
                <>
                    <p className="text-slate-600 leading-relaxed mb-4">
                        Conformément à la loi n° 09-08 relative à la protection des personnes physiques, vous disposez des droits suivants :
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {[
                            ['Droit d\'accès', 'Consulter vos données personnelles'],
                            ['Droit de rectification', 'Corriger les données inexactes'],
                            ['Droit de suppression', 'Demander l\'effacement de vos données'],
                            ['Droit d\'opposition', 'Vous opposer au traitement'],
                        ].map(([title, desc], i) => (
                            <div key={i} className="bg-emerald-50 rounded-xl px-4 py-3">
                                <div className="text-sm font-bold text-emerald-800">{title}</div>
                                <div className="text-emerald-600 text-xs mt-0.5">{desc}</div>
                            </div>
                        ))}
                    </div>
                    <p className="text-slate-500 text-sm mt-4">
                        Pour exercer ces droits : <strong className="text-slate-700">contactus@fox-petroleum.com</strong>
                    </p>
                </>
            ),
        },
        {
            icon: Cookie,
            title: 'Cookies',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    Notre site utilise des cookies nécessaires au bon fonctionnement de la plateforme.
                    Ces cookies permettent de maintenir votre session et de personnaliser votre expérience.
                    <strong className="text-slate-800"> Aucun cookie publicitaire n'est utilisé.</strong>
                </p>
            ),
        },
        {
            icon: MessageCircle,
            title: 'Contact',
            content: (
                <div className="grid sm:grid-cols-3 gap-3">
                    {[
                        ['Email', 'contactus@fox-petroleum.com'],
                        ['Téléphone', '+212 522 243 030'],
                        ['Adresse', 'Résidence Al Azizia Boulevard Royaume Arabie Saoudite 3ème Etage N°20 TANGER'],
                    ].map(([label, value], i) => (
                        <div key={i} className="bg-slate-50 rounded-xl px-4 py-3">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</div>
                            <div className="text-slate-700 text-sm font-medium">{value}</div>
                        </div>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]">
                    <img src="/logo.png" alt="" className="absolute -right-20 -top-20 w-96 h-96 object-contain" />
                </div>
                <nav className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
                    <div className="flex items-center justify-between mb-12">
                        <Link to="/" className="flex items-center gap-3 group">
                            <img src="/logo.png" alt="Fox Petroleum" className="w-9 h-9 object-contain transition-transform group-hover:scale-105" />
                            <span className="text-base font-extrabold text-white">Fox <span className="text-amber-400">Petroleum</span></span>
                        </Link>
                        <Link to="/">
                            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10 rounded-full gap-2">
                                <ArrowLeft className="w-4 h-4" /> Accueil
                            </Button>
                        </Link>
                    </div>
                    <div className="max-w-2xl">
                        <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Protection des données</p>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Politique de Confidentialité</h1>
                        <p className="text-slate-400 text-base">Dernière mise à jour : 1er janvier 2026</p>
                    </div>
                </nav>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
                <div className="space-y-4 pb-20">
                    {sections.map((section, i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                    <section.icon className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{i + 1}.</span>
                                    <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                                </div>
                            </div>
                            <div className="ml-0 sm:ml-14">{section.content}</div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Fox Petroleum" className="w-7 h-7 object-contain opacity-50" />
                            <span className="text-sm font-bold text-slate-500">Fox <span className="text-amber-500/60">Petroleum</span></span>
                        </div>
                        <div className="flex items-center gap-6 text-xs text-slate-500">
                            <Link to="/privacy" className="text-white font-semibold">Confidentialité</Link>
                            <Link to="/terms" className="hover:text-white transition-colors">CGV</Link>
                            <Link to="/legal" className="hover:text-white transition-colors">Mentions légales</Link>
                        </div>
                        <p className="text-slate-600 text-xs">© 2026 Fox Petroleum</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicyPage;
