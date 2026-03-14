import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, Briefcase, Heart, Send, TrendingUp, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { careersService, type Career } from '@/services/careers';

const CareersPage = () => {
    const [positions, setPositions] = useState<Career[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCareers = async () => {
            try {
                const data = await careersService.getPublicCareers();
                setPositions(data || []);
            } catch {
                // Silently fail — page still renders with no positions
            } finally {
                setIsLoading(false);
            }
        };
        fetchCareers();
    }, []);

    const values = [
        { icon: Heart, title: 'Passion', desc: 'Nous sommes passionnés par notre métier et nous nous engageons à fournir un service d\'excellence.', color: 'bg-rose-50 text-rose-600' },
        { icon: Users, title: 'Esprit d\'équipe', desc: 'Nous travaillons ensemble pour atteindre nos objectifs et nous soutenons mutuellement.', color: 'bg-blue-50 text-blue-600' },
        { icon: MapPin, title: 'Proximité', desc: 'Présents sur tout le territoire, nous restons proches de nos clients et de nos collaborateurs.', color: 'bg-emerald-50 text-emerald-600' },
        { icon: TrendingUp, title: 'Croissance', desc: 'Évoluez dans une entreprise en pleine expansion avec de réelles opportunités de carrière.', color: 'bg-amber-50 text-amber-600' },
        { icon: Shield, title: 'Sécurité', desc: 'La sécurité au travail est notre priorité absolue dans toutes nos opérations.', color: 'bg-purple-50 text-purple-600' },
        { icon: Clock, title: 'Flexibilité', desc: 'Nous offrons un environnement de travail flexible et respectueux de l\'équilibre de vie.', color: 'bg-sky-50 text-sky-600' },
    ];

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
                            <Briefcase className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Carrières</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Rejoignez l'aventure Fox Petroleum</h1>
                        <p className="text-slate-400 text-base max-w-lg">
                            Une entreprise dynamique et en pleine croissance. Nous valorisons le talent,
                            l'engagement et l'esprit d'équipe.
                        </p>
                    </div>
                </nav>
            </header>

            <main className="flex-1">
                {/* Values */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {values.map((v, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                                <div className={`w-10 h-10 rounded-xl ${v.color} flex items-center justify-center mb-4`}>
                                    <v.icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-1">{v.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Positions */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center mb-10">
                        <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-2">Opportunités</p>
                        <h2 className="text-2xl font-extrabold text-slate-900">Postes ouverts</h2>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : positions.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-600 text-lg font-semibold mb-1">Aucun poste ouvert pour le moment</p>
                            <p className="text-slate-400 text-sm">Revenez bientôt ou envoyez une candidature spontanée ci-dessous.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {positions.map((pos) => (
                                <div key={pos.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow group">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">{pos.title}</h3>
                                        <span className="flex-shrink-0 px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 rounded-full">{pos.type}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{pos.location}</span>
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{pos.description}</p>
                                    {pos.requirements && (
                                        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Prérequis</p>
                                            <p className="text-sm text-slate-600 whitespace-pre-line">{pos.requirements}</p>
                                        </div>
                                    )}
                                    <a href={`mailto:${pos.contactEmail}?subject=Candidature - ${pos.title}`}>
                                        <Button size="sm" className="rounded-full bg-slate-900 hover:bg-amber-600 transition-colors gap-2">
                                            <Send className="w-3.5 h-3.5" />
                                            Postuler
                                        </Button>
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Spontaneous Application */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                    <div className="relative bg-slate-900 rounded-2xl overflow-hidden p-8 sm:p-12 text-center">
                        <div className="absolute inset-0 opacity-[0.03]">
                            <img src="/logo.png" alt="" className="absolute right-8 bottom-0 w-64 h-64 object-contain" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                                <Send className="w-6 h-6 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Candidature spontanée</h3>
                            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                                Vous ne trouvez pas le poste qui vous correspond ? Envoyez-nous votre CV.
                            </p>
                            <a href="mailto:rh@foxpetroleum.ma">
                                <Button className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold gap-2 px-6">
                                    rh@foxpetroleum.ma
                                </Button>
                            </a>
                        </div>
                    </div>
                </section>
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

export default CareersPage;
