import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Server, BookOpen, ShieldAlert, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LegalNoticePage = () => {
    const sections = [
        {
            icon: Building2,
            title: 'Informations légales',
            content: (
                <>
                    <p className="text-slate-600 leading-relaxed mb-4">
                        Le site <strong className="text-slate-800">foxpetroleum.ma</strong> est édité par la société <strong className="text-slate-800">FoxPetroleum SARL</strong>,
                        société à responsabilité limitée au capital de 100 000 MAD, immatriculée au Registre de Commerce
                        de Tanger sous le numéro RC N° : 119871.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {[
                            ['Raison sociale', 'FoxPetroleum SARL'],
                            ['Siège social', 'Rés. Al Azizia, Bd Royaume Arabie Saoudite, 3ème Ét. N°20, Tanger'],
                            ['ICE', '002890653000024'],
                            ['Téléphone', '+212 522 243 030'],
                            ['Email', 'contactus@fox-petroleum.com'],
                            ['Directeur de général', 'M. Mohamed Ennejary'],
                        ].map(([label, value], i) => (
                            <div key={i} className="bg-slate-50 rounded-xl px-4 py-3">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</div>
                                <div className="text-slate-700 text-sm font-medium">{value}</div>
                            </div>
                        ))}
                    </div>
                </>
            ),
        },
        {
            icon: Server,
            title: 'Hébergement',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    Le site est hébergé par la société FoxPetroleum SARL sur ses propres serveurs situés au Maroc.
                </p>
            ),
        },
        {
            icon: BookOpen,
            title: 'Propriété intellectuelle',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    L'ensemble du contenu du site foxpetroleum.ma (textes, images, vidéos, logos, icônes, sons,
                    logiciels, etc.) est protégé par le droit d'auteur et le droit de la propriété intellectuelle.
                    Toute reproduction, représentation, modification, publication, adaptation, totale ou partielle,
                    des éléments du site est interdite sans l'autorisation écrite préalable de FoxPetroleum SARL.
                </p>
            ),
        },
        {
            icon: ShieldAlert,
            title: 'Limitation de responsabilité',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    FoxPetroleum SARL ne saurait être tenue pour responsable des dommages directs ou indirects
                    causés au matériel de l'utilisateur lors de l'accès au site. FoxPetroleum SARL décline toute
                    responsabilité quant à l'utilisation qui pourrait être faite des informations présentes sur ce site.
                </p>
            ),
        },
        {
            icon: Scale,
            title: 'Droit applicable',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    Les présentes mentions légales sont régies par le droit marocain. En cas de litige, les tribunaux
                    de Tanger seront seuls compétents.
                </p>
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
                        <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Informations légales</p>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Mentions Légales</h1>
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
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Article {i + 1}</span>
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
                            <Link to="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
                            <Link to="/terms" className="hover:text-white transition-colors">CGV</Link>
                            <Link to="/legal" className="text-white font-semibold">Mentions légales</Link>
                        </div>
                        <p className="text-slate-600 text-xs">© 2026 Fox Petroleum</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LegalNoticePage;
