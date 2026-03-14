import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, ShoppingCart, DollarSign, Truck, CreditCard, AlertTriangle, Package, Zap, Scale, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsPage = () => {
    const sections = [
        {
            icon: FileText,
            title: 'Objet',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    Les présentes conditions générales de vente régissent les relations contractuelles entre
                    FoxPetroleum SARL et ses clients professionnels pour la distribution et la vente de
                    lubrifiants, huiles moteur, mazout et produits dérivés du pétrole.
                </p>
            ),
        },
        {
            icon: ShoppingCart,
            title: 'Commandes',
            content: (
                <>
                    <p className="text-slate-600 leading-relaxed mb-3">
                        Les commandes peuvent être passées par téléphone, email, ou via notre plateforme en ligne.
                        Toute commande est considérée comme ferme et définitive après confirmation par FoxPetroleum SARL.
                    </p>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <p className="text-amber-800 text-sm font-medium">
                            Les quantités minimales de commande sont fixées selon les produits. Les commandes inférieures
                            aux minimums ne pourront être traitées sauf accord spécial.
                        </p>
                    </div>
                </>
            ),
        },
        {
            icon: DollarSign,
            title: 'Prix',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    Les prix sont exprimés en <strong className="text-slate-800">Dirhams marocains (MAD)</strong> hors taxes. La TVA applicable est de 20%
                    sauf disposition légale contraire. Les prix peuvent être révisés en cas de variation
                    significative des cours du pétrole ou des matières premières.
                </p>
            ),
        },
        {
            icon: Truck,
            title: 'Livraison',
            content: (
                <>
                    <p className="text-slate-600 leading-relaxed mb-3">
                        Les délais de livraison sont donnés à titre indicatif. FoxPetroleum SARL s'engage à mettre
                        tous les moyens en œuvre pour respecter les délais convenus.
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                        La livraison est réputée effectuée lors de la remise physique de la marchandise au client
                        ou à son représentant, attestée par la <strong className="text-slate-800">signature du bon de livraison</strong>.
                    </p>
                </>
            ),
        },
        {
            icon: CreditCard,
            title: 'Paiement',
            content: (
                <>
                    <p className="text-slate-600 leading-relaxed mb-3">
                        Sauf accord contraire, les factures sont payables à <strong className="text-slate-800">30 jours date de facture</strong>.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3 mb-3">
                        {['Virement bancaire', 'Chèque', 'Espèces'].map((m, i) => (
                            <div key={i} className="bg-slate-50 rounded-xl px-4 py-3 text-center">
                                <div className="text-slate-700 text-sm font-semibold">{m}</div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <p className="text-red-800 text-sm font-medium">
                            Retard de paiement : pénalités de 1,5%/mois sur le montant TTC + indemnité forfaitaire de 40 MAD.
                        </p>
                    </div>
                </>
            ),
        },
        {
            icon: AlertTriangle,
            title: 'Réclamations',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    Toute réclamation relative à la qualité ou la quantité des produits livrés doit être
                    formulée par écrit dans un délai de <strong className="text-slate-800">48 heures</strong> suivant la livraison. Passé ce délai,
                    aucune réclamation ne sera acceptée.
                </p>
            ),
        },
        {
            icon: Package,
            title: 'Réserve de propriété',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    Les marchandises vendues restent la propriété de FoxPetroleum SARL jusqu'au paiement
                    intégral du prix. En cas de non-paiement, FoxPetroleum SARL se réserve le droit de
                    revendiquer la restitution des marchandises.
                </p>
            ),
        },
        {
            icon: Zap,
            title: 'Force majeure',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    FoxPetroleum SARL ne saurait être tenue responsable de l'inexécution ou du retard dans
                    l'exécution de ses obligations en cas de force majeure, incluant notamment : catastrophes
                    naturelles, grèves, pannes, pénuries de matières premières, ou décisions gouvernementales.
                </p>
            ),
        },
        {
            icon: Scale,
            title: 'Litiges',
            content: (
                <p className="text-slate-600 leading-relaxed">
                    Les présentes CGV sont soumises au <strong className="text-slate-800">droit marocain</strong>. En cas de litige, les parties
                    s'efforceront de trouver une solution amiable. À défaut, les tribunaux de commerce
                    de Tanger seront seuls compétents.
                </p>
            ),
        },
        {
            icon: Phone,
            title: 'Contact',
            content: (
                <div className="grid sm:grid-cols-2 gap-3">
                    {[
                        ['Raison sociale', 'FoxPetroleum SARL'],
                        ['Adresse', 'Rés. Al Azizia, Bd Royaume Arabie Saoudite, 3ème Ét. N°20, Tanger'],
                        ['Téléphone', '+212 522 243 030'],
                        ['Email', 'contactus@fox-petroleum.com'],
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
                        <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Conditions commerciales</p>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Conditions Générales de Vente</h1>
                        <p className="text-slate-400 text-base">Applicables à compter du 1er janvier 2026</p>
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
                            <Link to="/terms" className="text-white font-semibold">CGV</Link>
                            <Link to="/legal" className="hover:text-white transition-colors">Mentions légales</Link>
                        </div>
                        <p className="text-slate-600 text-xs">© 2026 Fox Petroleum</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default TermsPage;
