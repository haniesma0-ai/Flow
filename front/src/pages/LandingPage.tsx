import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, BarChart3, Shield, Clock, MapPin,
  Phone, Mail, ChevronDown, Menu, X, CheckCircle2,
  ArrowRight, Star, Users, Package, Flame,
  Gauge, HeartHandshake, Quote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/services/api';

const LOGO_URL = '/logo.png';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [contactForm, setContactForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: '',
  });
  const [contactSending, setContactSending] = useState(false);
  const testimonialsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  // Logo click burst effect (inspired by neew.html)
  const handleLogoClick = useCallback(() => {
    const img = logoRef.current;
    if (!img) return;
    // Trigger spin
    img.style.animation = 'none';
    img.offsetHeight; // reflow
    img.style.animation = 'logoHeroSpin 0.7s ease';
    img.style.filter = 'drop-shadow(0 0 40px rgba(245,200,66,1))';
    setTimeout(() => {
      if (img) {
        img.style.animation = 'logoBob 4s ease-in-out infinite';
        img.style.filter = 'drop-shadow(0 0 18px rgba(201,144,42,0.7))';
      }
    }, 750);

    // Ripple burst
    const wrap = img.parentElement;
    if (!wrap) return;
    const burst = document.createElement('div');
    burst.style.cssText = `
      position:absolute; width:20px; height:20px; border-radius:50%;
      background:rgba(245,200,66,0.6); pointer-events:none;
      left:50%; top:50%; transform:translate(-50%,-50%); z-index:10;
    `;
    wrap.appendChild(burst);
    burst.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: '0.8' },
      { transform: 'translate(-50%,-50%) scale(14)', opacity: '0' }
    ], { duration: 600, easing: 'ease-out' }).onfinish = () => burst.remove();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    testimonialsRef.current = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 6000);
    return () => {
      if (testimonialsRef.current) clearInterval(testimonialsRef.current);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: 'Accueil', id: 'hero' },
    { label: 'Services', id: 'services' },
    { label: 'À propos', id: 'about' },
    { label: 'Pourquoi nous', id: 'advantages' },
    { label: 'Témoignages', id: 'testimonials' },
    { label: 'Contact', id: 'contact' },
  ];

  const testimonials = [
    {
      name: 'Mohamed Alami',
      role: 'Directeur, Auto Garage Marrakech',
      content: 'Fox Petroleum est notre fournisseur de confiance depuis 5 ans. Leur réactivité et la qualité de leurs produits sont irréprochables.',
      rating: 5,
    },
    {
      name: 'Fatima Benkirane',
      role: 'Responsable Achats, Transport Rapide SA',
      content: 'Un partenaire fiable qui comprend nos besoins. Le système de suivi en ligne nous fait gagner un temps précieux.',
      rating: 5,
    },
    {
      name: 'Karim Idrissi',
      role: 'Gérant, Carrière du Sud',
      content: 'Service impeccable, livraison toujours à l\'heure. Je recommande vivement Fox Petroleum pour tous vos besoins en lubrifiants.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ═══════════════════ NAVIGATION ═══════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-md py-2'
          : 'bg-transparent py-4'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={LOGO_URL}
                alt="Fox Petroleum"
                className="w-11 h-11 object-contain drop-shadow-lg transition-transform group-hover:scale-105"
              />
              <span className={`text-lg font-extrabold tracking-tight transition-colors ${isScrolled ? 'text-slate-900' : 'text-white'
                }`}>
                Fox <span className="text-amber-500">Petroleum</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:bg-white/15 ${isScrolled
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-white/80 hover:text-white'
                    }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`font-medium ${isScrolled ? 'text-slate-700' : 'text-white/90 hover:text-white hover:bg-white/10'}`}
                >
                  Connexion
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() => scrollToSection('contact')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-full px-6 shadow-lg shadow-amber-500/25"
              >
                Demander un devis
              </Button>
            </div>

            {/* Mobile burger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg"
            >
              {isMobileMenuOpen ? (
                <X className={`w-6 h-6 ${isScrolled ? 'text-slate-900' : 'text-white'}`} />
              ) : (
                <Menu className={`w-6 h-6 ${isScrolled ? 'text-slate-900' : 'text-white'}`} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t shadow-xl animate-fade-in">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="block w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl font-medium"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-4 border-t space-y-2">
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full rounded-xl">Connexion</Button>
                </Link>
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-xl"
                  onClick={() => scrollToSection('contact')}
                >
                  Demander un devis
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center">
        {/* Layered background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-slate-950" />
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=1920&q=80')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/80" />
          {/* Decorative golden diagonal */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-32 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-sm font-medium mb-8">
                <Flame className="w-4 h-4" />
                Leader de la distribution de lubrifiants au Maroc
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6">
                L'énergie qui fait
                <span className="block bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 bg-clip-text text-transparent">
                  avancer le Maroc
                </span>
              </h1>

              <p className="text-lg text-slate-300 max-w-xl mb-10 leading-relaxed">
                Distribution et transport de lubrifiants industriels, huiles moteur
                et produits pétroliers. Fiabilité, rapidité et excellence à chaque livraison.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => scrollToSection('contact')}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-full px-8 shadow-xl shadow-amber-500/30"
                >
                  Devis gratuit
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('services')}
                  className="border-white/25 text-white hover:bg-white/10 rounded-full px-8"
                >
                  Nos services
                </Button>
              </div>
            </div>

            {/* Right — logo / hero visual (inspired by neew.html) */}
            <div className="hidden lg:flex items-center justify-center relative">
              {/* Floating particles */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="hero-particle"
                  style={{
                    '--p-size': `${(Math.random() * 3 + 1.5).toFixed(1)}px`,
                    '--p-x': `${Math.random() * 100}%`,
                    '--p-dur': `${(Math.random() * 8 + 6).toFixed(1)}s`,
                    '--p-delay': `${(Math.random() * 10).toFixed(1)}s`,
                  } as React.CSSProperties}
                />
              ))}

              {/* Logo assembly */}
              <div
                className="hero-logo-wrap relative w-[220px] h-[220px] flex items-center justify-center cursor-pointer"
                onClick={handleLogoClick}
              >
                {/* Orbit rings */}
                <div className="orbit-container">
                  <div className="orbit-ring orbit-ring-1" />
                  <div className="orbit-ring orbit-ring-2" />
                  <div className="orbit-ring orbit-ring-3" />
                </div>

                {/* Glow pulse */}
                <div className="logo-glow-orb" />

                {/* Logo */}
                <img
                  ref={logoRef}
                  src={LOGO_URL}
                  alt="Fox Petroleum"
                  className="hero-logo-img w-40 h-40 object-contain"
                />

                {/* Scanline on hover */}
                <div className="hero-logo-scanline" />
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
            {[
              { value: '15+', label: "Années d'expérience" },
              { value: '500+', label: 'Clients satisfaits' },
              { value: '50K+', label: 'Livraisons effectuées' },
              { value: '24/7', label: 'Service disponible' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 px-6 py-6 text-center">
                <div className="text-3xl font-extrabold text-amber-400">{stat.value}</div>
                <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <button
          onClick={() => scrollToSection('services')}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 animate-bounce text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronDown className="w-7 h-7" />
        </button>
      </section>

      {/* ═══════════════════ SERVICES — BENTO GRID ═══════════════════ */}
      <section id="services" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">
                Nos Services
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
                Tout ce qu'il faut pour votre activité
              </h2>
            </div>
            <p className="text-slate-500 lg:max-w-sm lg:text-right">
              De la commande à la livraison, un écosystème complet conçu autour de votre métier.
            </p>
          </div>

          {/* Bento layout: 2 large + 4 small */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Featured card 1 — spans 2 rows on lg */}
            <div className="lg:row-span-2 relative group overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-10 flex flex-col justify-end min-h-[340px]">
              <div className="absolute top-6 right-6 w-20 h-20 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                <Truck className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Transport &amp; Livraison</h3>
              <p className="text-slate-400 leading-relaxed">
                Flotte moderne de camions-citernes équipés GPS pour une livraison rapide,
                traçable et sécurisée sur tout le territoire marocain.
              </p>
              <div className="mt-6 flex items-center gap-2 text-amber-400 text-sm font-semibold group-hover:gap-3 transition-all">
                <span>En savoir plus</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Small cards */}
            <div className="group rounded-3xl bg-blue-50 p-8 hover:shadow-lg transition-all duration-300">
              <Gauge className="w-9 h-9 text-blue-600 mb-5" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Distribution de lubrifiants</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Huiles moteur, huiles industrielles, graisses et fluides premium pour toutes applications.
              </p>
            </div>

            <div className="group rounded-3xl bg-emerald-50 p-8 hover:shadow-lg transition-all duration-300">
              <BarChart3 className="w-9 h-9 text-emerald-600 mb-5" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Gestion de stock</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Suivi temps réel, alertes automatiques et réapprovisionnement optimisé.
              </p>
            </div>

            <div className="group rounded-3xl bg-purple-50 p-8 hover:shadow-lg transition-all duration-300">
              <Shield className="w-9 h-9 text-purple-600 mb-5" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Conseil technique</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Nos experts vous recommandent les meilleurs produits selon votre secteur.
              </p>
            </div>

            {/* Featured card 2 — horizontal */}
            <div className="md:col-span-2 relative group overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 p-10 flex flex-col sm:flex-row sm:items-center gap-8 min-h-[180px]">
              <div className="flex-shrink-0 w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Service urgent 24/7</h3>
                <p className="text-white/80 leading-relaxed max-w-lg">
                  Intervention rapide pour vos besoins urgents. Livraison express disponible jour et nuit,
                  week-ends et jours fériés inclus.
                </p>
              </div>
              <div className="sm:ml-auto flex-shrink-0">
                <Package className="w-12 h-12 text-white/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ ABOUT — TIMELINE STYLE ═══════════════════ */}
      <section id="about" className="py-28 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-16 items-start">
            {/* Left column — 3/5 */}
            <div className="lg:col-span-3">
              <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">
                Notre histoire
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-8">
                Bâtir la confiance depuis 2009
              </h2>

              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Fox Petroleum est une entreprise marocaine spécialisée dans la distribution
                et le transport de lubrifiants. Forts de plus de 15 ans d'expérience,
                nous servons une clientèle diversifiée — des garages automobiles aux grandes industries.
              </p>

              {/* Milestone timeline */}
              <div className="space-y-0 border-l-2 border-amber-300 ml-4">
                {[
                  { year: '2009', text: 'Création de Fox Petroleum à Tanger' },
                  { year: '2014', text: 'Expansion vers Casablanca et Marrakech' },
                  { year: '2019', text: 'Cap des 300 clients professionnels' },
                  { year: '2024', text: 'Lancement de la plateforme de suivi digital' },
                ].map((m, i) => (
                  <div key={i} className="relative pl-8 pb-8 last:pb-0">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white" />
                    <span className="text-amber-600 font-bold text-sm">{m.year}</span>
                    <p className="text-slate-700 font-medium mt-0.5">{m.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — 2/5 stacked cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <div className="text-5xl font-extrabold text-amber-500 mb-2">+35%</div>
                <div className="text-slate-500 font-medium">Croissance annuelle moyenne</div>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    'Certifié ISO',
                    'Livraison traçable',
                    'Prix compétitifs',
                    'Support dédié',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl overflow-hidden shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=600&q=80"
                  alt="Installation Fox Petroleum"
                  className="w-full h-56 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ ADVANTAGES — NUMBERED HORIZONTAL ═══════════════════ */}
      <section id="advantages" className="py-28 bg-slate-900 relative overflow-hidden">
        {/* Background logo watermark */}
        <img
          src={LOGO_URL}
          alt=""
          className="absolute -right-32 -bottom-32 w-[500px] h-[500px] object-contain opacity-[0.03] pointer-events-none"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-widest">
              Pourquoi nous
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              Pourquoi choisir Fox Petroleum ?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: '01',
                icon: MapPin,
                title: 'Couverture nationale',
                desc: 'Présents dans toutes les régions du Maroc pour vous servir partout.',
              },
              {
                num: '02',
                icon: Users,
                title: 'Équipe expérimentée',
                desc: 'Des professionnels formés et passionnés à votre service.',
              },
              {
                num: '03',
                icon: HeartHandshake,
                title: 'Qualité garantie',
                desc: 'Produits certifiés et contrôlés selon les normes internationales.',
              },
              {
                num: '04',
                icon: Clock,
                title: 'Réactivité',
                desc: 'Livraison express disponible pour vos urgences.',
              },
            ].map((adv, i) => (
              <div
                key={i}
                className="group bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300"
              >
                <span className="text-5xl font-extrabold text-amber-500/20 group-hover:text-amber-500/40 transition-colors">
                  {adv.num}
                </span>
                <adv.icon className="w-7 h-7 text-amber-400 mt-4 mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">{adv.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS — FEATURED CAROUSEL ═══════════════════ */}
      <section id="testimonials" className="py-28 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">
                Témoignages
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-6">
                La parole à nos clients
              </h2>
              <p className="text-slate-500 mb-10">
                Découvrez pourquoi des centaines d'entreprises marocaines font confiance
                à Fox Petroleum pour leurs besoins en lubrifiants.
              </p>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${i === activeTestimonial
                      ? 'bg-amber-500 w-8'
                      : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Right — active testimonial */}
            <div className="relative min-h-[280px]">
              <Quote className="absolute -top-4 -left-4 w-16 h-16 text-amber-200" />
              <div className="bg-white rounded-3xl shadow-xl p-10 relative z-10">
                <div className="flex gap-1 mb-5">
                  {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-xl leading-relaxed mb-8 font-medium italic">
                  &ldquo;{testimonials[activeTestimonial].content}&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <span className="text-white font-bold text-lg">
                      {testimonials[activeTestimonial].name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold">{testimonials[activeTestimonial].name}</div>
                    <div className="text-slate-500 text-sm">{testimonials[activeTestimonial].role}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CONTACT — DARK/LIGHT SPLIT ═══════════════════ */}
      <section id="contact" className="relative">
        <div className="grid lg:grid-cols-2">
          {/* Left — dark info panel */}
          <div className="bg-slate-900 py-24 px-6 sm:px-12 lg:px-16 flex flex-col justify-center">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-widest">
              Contactez-nous
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-6">
              Prêt à collaborer ?
            </h2>
            <p className="text-slate-400 text-lg mb-12 max-w-md">
              Contactez-nous dès maintenant pour un devis personnalisé
              ou toute question sur nos produits et services.
            </p>

            <div className="space-y-8">
              <div className="flex items-center gap-5">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-500/15 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Téléphone</div>
                  <a href="tel:+212522243030" className="text-white font-semibold hover:text-amber-400 transition-colors">
                    +212 522 243 030
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-500/15 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Email</div>
                  <a href="mailto:contact@foxpetroleum.ma" className="text-white font-semibold hover:text-amber-400 transition-colors">
                    contact@foxpetroleum.ma
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-500/15 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Adresse</div>
                  <div className="text-white font-semibold max-w-xs">
                    Résidence Al Azizia, Bd Royaume Arabie Saoudite, 3ème Étage N°20, Tanger
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white py-24 px-6 sm:px-12 lg:px-16 flex items-center">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setContactSending(true);
                try {
                  await api.post('/contact', contactForm);
                  toast.success('Message envoyé avec succès ! Nous vous contacterons bientôt.');
                  setContactForm({ name: '', company: '', email: '', phone: '', message: '' });
                } catch (err: unknown) {
                  const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
                  const errors = axiosErr.response?.data?.errors;
                  if (errors) {
                    const firstError = Object.values(errors)[0]?.[0];
                    toast.error(firstError || 'Erreur lors de l\'envoi du message');
                  } else {
                    toast.error('Erreur lors de l\'envoi du message. Veuillez réessayer.');
                  }
                } finally {
                  setContactSending(false);
                }
              }}
              className="w-full max-w-lg space-y-5"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Envoyez-nous un message</h3>
              <p className="text-slate-500 text-sm mb-6">Remplissez le formulaire et nous vous répondrons sous 24h.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nom complet</label>
                  <input
                    type="text"
                    className="input-field rounded-xl"
                    placeholder="Votre nom"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Entreprise</label>
                  <input
                    type="text"
                    className="input-field rounded-xl"
                    placeholder="Votre entreprise"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    className="input-field rounded-xl"
                    placeholder="votre@email.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Téléphone</label>
                  <input
                    type="tel"
                    className="input-field rounded-xl"
                    placeholder="+212 5XX-XXXXXX"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Message</label>
                <textarea
                  className="input-field min-h-[130px] resize-none rounded-xl"
                  placeholder="Décrivez votre besoin..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl h-12 shadow-lg shadow-amber-500/20"
                disabled={contactSending}
              >
                {contactSending ? 'Envoi en cours...' : 'Envoyer le message'}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-12 mb-14">
            {/* Brand */}
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3 mb-5">
                <img src={LOGO_URL} alt="Fox Petroleum" className="w-10 h-10 object-contain" />
                <span className="text-xl font-extrabold">
                  Fox <span className="text-amber-500">Petroleum</span>
                </span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                Votre partenaire de confiance pour la distribution et le transport
                de lubrifiants au Maroc.
              </p>
            </div>

            {/* Services */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Services</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">Distribution</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">Transport</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">Gestion de stock</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">Conseil technique</button></li>
              </ul>
            </div>

            {/* Entreprise */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Entreprise</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">À propos</button></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Carrières</Link></li>
                <li><Link to="/news" className="hover:text-white transition-colors">Actualités</Link></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>

            {/* Légal */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Légal</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link to="/legal" className="hover:text-white transition-colors">Mentions légales</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Confidentialité</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">CGV</Link></li>
              </ul>
            </div>

            {/* CTA */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Démarrer</h4>
              <Button
                size="sm"
                onClick={() => scrollToSection('contact')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-full px-6"
              >
                Demander un devis
              </Button>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 text-xs">
              © 2026 Fox Petroleum. Tous droits réservés.
            </p>
            <p className="text-slate-600 text-xs">
              Développé au Maroc
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
