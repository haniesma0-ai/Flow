import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, ArrowRight, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NewsPage = () => {
    const articles = [
        {
            date: '10 Février 2026',
            title: 'FoxPetroleum inaugure un nouveau dépôt à Casablanca',
            summary: 'Dans le cadre de notre stratégie d\'expansion, nous avons inauguré un nouveau dépôt logistique à la zone industrielle de Casablanca, augmentant ainsi notre capacité de stockage de 40%.',
            category: 'Expansion',
        },
        {
            date: '28 Janvier 2026',
            title: 'Partenariat stratégique avec TotalEnergies',
            summary: 'FoxPetroleum renforce son partenariat avec TotalEnergies pour la distribution exclusive de la gamme Quartz dans la région du Sud du Maroc.',
            category: 'Partenariat',
        },
        {
            date: '15 Janvier 2026',
            title: 'Nouvelle flotte de véhicules écologiques',
            summary: 'Nous investissons dans une nouvelle flotte de camions répondant aux normes Euro 6, réduisant notre empreinte carbone de 25%.',
            category: 'Environnement',
        },
        {
            date: '5 Janvier 2026',
            title: 'FoxPetroleum obtient la certification ISO 9001:2015',
            summary: 'Notre engagement qualité se concrétise avec l\'obtention de la certification ISO 9001:2015 pour nos processus de distribution et logistique.',
            category: 'Certification',
        },
        {
            date: '20 Décembre 2025',
            title: 'Bilan annuel 2025 : une croissance de 35%',
            summary: 'FoxPetroleum clôture l\'année 2025 avec une croissance de 35% de son chiffre d\'affaires, portée par l\'expansion géographique et de nouveaux partenariats.',
            category: 'Résultats',
        },
        {
            date: '1 Décembre 2025',
            title: 'Lancement de la plateforme digitale',
            summary: 'Notre nouvelle plateforme en ligne permet à nos clients de passer commande, suivre leurs livraisons et consulter leurs factures en temps réel.',
            category: 'Innovation',
        },
    ];

    const categoryStyles: Record<string, { bg: string; text: string; dot: string }> = {
        Expansion: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
        Partenariat: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
        Environnement: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        Certification: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
        Résultats: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
        Innovation: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
    };

    // Featured article is the first one
    const featured = articles[0];
    const rest = articles.slice(1);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]">
                    <img src="/logo.png" alt="" className="absolute -right-20 -top-20 w-96 h-96 object-contain" />
                </div>
                <nav className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
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
                        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4">
                            <Newspaper className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Actualités</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Nos dernières nouvelles</h1>
                        <p className="text-slate-400 text-base">
                            Restez informé de nos partenariats, événements et développements.
                        </p>
                    </div>
                </nav>
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-20">
                {/* Featured Article */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 hover:shadow-md transition-shadow group">
                    <div className="grid md:grid-cols-2">
                        <div className="h-48 md:h-auto bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center relative overflow-hidden">
                            <img src="/logo.png" alt="" className="w-32 h-32 object-contain opacity-10 group-hover:opacity-20 transition-opacity" />
                            <div className="absolute top-4 left-4">
                                <span className="bg-amber-500 text-slate-900 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                                    À la une
                                </span>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-4">
                                {categoryStyles[featured.category] && (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${categoryStyles[featured.category].bg} ${categoryStyles[featured.category].text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${categoryStyles[featured.category].dot}`} />
                                        {featured.category}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <Calendar className="w-3 h-3" />
                                    {featured.date}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-amber-700 transition-colors">{featured.title}</h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6">{featured.summary}</p>
                            <button className="inline-flex items-center gap-2 text-amber-600 text-sm font-semibold hover:gap-3 transition-all">
                                Lire la suite <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Rest of articles */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rest.map((article, i) => (
                        <article key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                            <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative">
                                <img src="/logo.png" alt="" className="w-16 h-16 object-contain opacity-10 group-hover:opacity-20 transition-opacity" />
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-center gap-2.5 mb-3">
                                    {categoryStyles[article.category] && (
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full ${categoryStyles[article.category].bg} ${categoryStyles[article.category].text}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${categoryStyles[article.category].dot}`} />
                                            {article.category}
                                        </span>
                                    )}
                                    <span className="text-[11px] text-slate-400">{article.date}</span>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">{article.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 flex-1">{article.summary}</p>
                                <button className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-semibold mt-4 hover:gap-2.5 transition-all">
                                    Lire la suite <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </article>
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
                            <Link to="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
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

export default NewsPage;
