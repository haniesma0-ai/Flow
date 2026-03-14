import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, User, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { registerService } from '@/services/register';
import { toast } from 'sonner';

const RegisterPage = () => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await registerService.register({
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            toast.success(t('register.toast.success'));
            navigate('/login');
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || t('register.toast.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <div className="absolute inset-0 gradient-industrial" />
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: 'url(https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=1200&q=80)'
                    }}
                />
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <img src="/logo.png" alt="Fox Petroleum" className="w-9 h-9 object-contain" />
                        </div>
                        <div>
                            <a href="/"><span className="text-2xl font-bold">Fox<span className="text-amber-400">Petroleum</span></span></a>
                            <span className="block text-white/70 text-sm">{t('login.tagline')}</span>
                        </div>
                    </div>
                    <h1 className="text-4xl xl:text-5xl font-bold mb-6">
                        {t('register.welcomeTitle', 'Créez votre compte')}
                    </h1>
                    <p className="text-lg text-white/80 max-w-md">
                        {t('register.welcomeDesc', 'Rejoignez FoxPetroleum et accédez à votre espace de gestion personnalisé.')}
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 bg-white">
                <div className="max-w-md w-full mx-auto">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl gradient-industrial flex items-center justify-center">
                            <img src="/logo.png" alt="Fox Petroleum" className="w-7 h-7 object-contain" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-slate-900">Fox<span className="text-amber-500">Petroleum</span></span>
                            <span className="block text-slate-500 text-xs">{t('login.tagline')}</span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            {t('register.title')}
                        </h2>
                        <p className="text-slate-600">
                            {t('register.subtitle', 'Remplissez les informations ci-dessous pour créer votre compte.')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('register.name')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="input-field pl-11"
                                    placeholder={t('register.namePlaceholder', 'Votre nom complet')}
                                    required
                                    name="name"
                                    id="register-name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('register.email')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="input-field pl-11"
                                    placeholder={t('register.emailPlaceholder', 'votre@email.com')}
                                    required
                                    name="email"
                                    id="register-email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('register.password')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="input-field pl-11 pr-12"
                                    placeholder="••••••••"
                                    required
                                    name="password"
                                    id="register-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('register.confirmPassword')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordConfirmation}
                                    onChange={e => setPasswordConfirmation(e.target.value)}
                                    className="input-field pl-11"
                                    placeholder="••••••••"
                                    required
                                    name="password_confirmation"
                                    id="register-password-confirmation"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    {t('register.submitting')}
                                </>
                            ) : (
                                t('register.submit')
                            )}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-600">
                        {t('register.hasAccount')}{' '}
                        <Link to="/login" className="text-amber-600 hover:underline font-medium">
                            {t('register.login')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
