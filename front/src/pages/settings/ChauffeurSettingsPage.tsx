import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Save, User, Bell, Shield, Truck, MapPin, Phone,
    Navigation, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';

const ChauffeurSettingsPage = () => {
    const { t, i18n } = useTranslation();
    const { auth } = useAuth();
    const user = auth.user;

    const [activeTab, setActiveTab] = useState('profile');

    // Profile form
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });
    const [profileSaving, setProfileSaving] = useState(false);

    // Security form
    const [passwords, setPasswords] = useState({
        current: '',
        newPassword: '',
        confirm: '',
    });
    const [passwordSaving, setPasswordSaving] = useState(false);

    // Driver preferences
    const [driverPrefs, setDriverPrefs] = useState(() => {
        const stored = localStorage.getItem('driverPreferences');
        if (stored) {
            try { return JSON.parse(stored); } catch { /* ignore */ }
        }
        return {
            gpsHighAccuracy: true,
            autoStartNavigation: false,
            soundAlerts: true,
            vibrationAlerts: true,
        };
    });

    // Notification preferences
    const [notifications, setNotifications] = useState(() => {
        const stored = localStorage.getItem('driverNotificationPrefs');
        if (stored) {
            try { return JSON.parse(stored); } catch { /* ignore */ }
        }
        return {
            newDeliveries: true,
            statusChanges: true,
            cashVerified: true,
            urgentAlerts: true,
        };
    });

    const handleProfileSave = async () => {
        setProfileSaving(true);
        try {
            const response = await api.put('/auth/profile', {
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
            });
            const storedAuth = localStorage.getItem('auth');
            if (storedAuth) {
                const parsed = JSON.parse(storedAuth);
                parsed.user = { ...parsed.user, ...response.data };
                localStorage.setItem('auth', JSON.stringify(parsed));
            }
            toast.success(t('settings.toast.profileSaved'));
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { errors?: { email?: string[] }; error?: string } } };
            const msg = axiosErr.response?.data?.errors?.email?.[0] || axiosErr.response?.data?.error || t('settings.toast.profileError');
            toast.error(msg);
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordSave = async () => {
        if (passwords.newPassword !== passwords.confirm) {
            toast.error(t('settings.toast.passwordMismatch'));
            return;
        }
        if (passwords.newPassword.length < 8) {
            toast.error(t('settings.toast.passwordTooShort'));
            return;
        }
        setPasswordSaving(true);
        try {
            await api.put('/auth/password', {
                current_password: passwords.current,
                new_password: passwords.newPassword,
                new_password_confirmation: passwords.confirm,
            });
            setPasswords({ current: '', newPassword: '', confirm: '' });
            toast.success(t('settings.toast.passwordChanged'));
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || t('settings.toast.passwordError');
            toast.error(msg);
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleDriverPrefsSave = () => {
        localStorage.setItem('driverPreferences', JSON.stringify(driverPrefs));
        toast.success('Préférences de conduite enregistrées');
    };

    const handleNotificationsSave = () => {
        localStorage.setItem('driverNotificationPrefs', JSON.stringify(notifications));
        toast.success(t('settings.toast.notificationsSaved'));
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    {t('settings.title')}
                </h2>
                <p className="text-slate-600 mt-1">
                    Gérez vos paramètres personnels et préférences de livraison
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                    <TabsTrigger value="profile">
                        <User className="w-4 h-4 mr-2" />
                        Profil
                    </TabsTrigger>
                    <TabsTrigger value="driving">
                        <Truck className="w-4 h-4 mr-2" />
                        Conduite
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        <Bell className="w-4 h-4 mr-2" />
                        Alertes
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Shield className="w-4 h-4 mr-2" />
                        Sécurité
                    </TabsTrigger>
                </TabsList>

                {/* ── Profile Tab ──────────────────────── */}
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('settings.profile.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Truck className="w-10 h-10 text-orange-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{user?.name}</p>
                                    <p className="text-sm text-slate-500">Chauffeur-Livreur</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{t('settings.profile.fullName')}</Label>
                                    <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('settings.profile.email')}</Label>
                                    <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label><Phone className="w-4 h-4 inline mr-1" />{t('settings.profile.phone')}</Label>
                                    <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label><Globe className="w-4 h-4 inline mr-1" />Langue</Label>
                                    <select
                                        value={i18n.language}
                                        onChange={(e) => {
                                            i18n.changeLanguage(e.target.value);
                                            localStorage.setItem('language', e.target.value);
                                            document.documentElement.dir = e.target.value === 'ar' ? 'rtl' : 'ltr';
                                            document.documentElement.lang = e.target.value;
                                        }}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="fr">Français</option>
                                        <option value="ar">العربية</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleProfileSave} disabled={profileSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {profileSaving ? t('common.saving') : t('common.save')}
                        </Button>
                    </div>
                </TabsContent>

                {/* ── Driving Preferences Tab ──────────── */}
                <TabsContent value="driving" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Navigation className="w-5 h-5 text-blue-600" />
                                Préférences GPS & Navigation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {([
                                {
                                    key: 'gpsHighAccuracy' as const,
                                    label: 'GPS haute précision',
                                    desc: 'Utiliser le GPS haute précision (consomme plus de batterie)',
                                    icon: <MapPin className="w-4 h-4 text-blue-500" />,
                                },
                                {
                                    key: 'autoStartNavigation' as const,
                                    label: 'Navigation automatique',
                                    desc: 'Ouvrir automatiquement la carte au démarrage d\'une livraison',
                                    icon: <Navigation className="w-4 h-4 text-green-500" />,
                                },
                            ]).map((item) => (
                                <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">{item.icon}</div>
                                        <div>
                                            <p className="font-medium text-slate-900">{item.label}</p>
                                            <p className="text-sm text-slate-500">{item.desc}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={driverPrefs[item.key]}
                                            onChange={(e) => setDriverPrefs({ ...driverPrefs, [item.key]: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-amber-600" />
                                Alertes sonores & vibrations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {([
                                {
                                    key: 'soundAlerts' as const,
                                    label: 'Alertes sonores',
                                    desc: 'Jouer un son lors de nouvelles notifications de livraison',
                                },
                                {
                                    key: 'vibrationAlerts' as const,
                                    label: 'Vibrations',
                                    desc: 'Vibrer le téléphone pour les alertes urgentes',
                                },
                            ]).map((item) => (
                                <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                    <div>
                                        <p className="font-medium text-slate-900">{item.label}</p>
                                        <p className="text-sm text-slate-500">{item.desc}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={driverPrefs[item.key]}
                                            onChange={(e) => setDriverPrefs({ ...driverPrefs, [item.key]: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleDriverPrefsSave}>
                            <Save className="w-4 h-4 mr-2" />
                            {t('common.save')}
                        </Button>
                    </div>
                </TabsContent>

                {/* ── Notifications Tab ────────────────── */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications de livraison</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {([
                                { key: 'newDeliveries' as const, label: 'Nouvelles livraisons', desc: 'Être notifié lorsqu\'une livraison vous est assignée' },
                                { key: 'statusChanges' as const, label: 'Changements de statut', desc: 'Notification en cas de modification de vos livraisons' },
                                { key: 'cashVerified' as const, label: 'Caisse vérifiée', desc: 'Recevoir une notification quand votre résumé de caisse est vérifié' },
                                { key: 'urgentAlerts' as const, label: 'Alertes urgentes', desc: 'Notifications prioritaires de l\'administration' },
                            ]).map((item) => (
                                <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                    <div>
                                        <p className="font-medium text-slate-900">{item.label}</p>
                                        <p className="text-sm text-slate-500">{item.desc}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notifications[item.key]}
                                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleNotificationsSave}>
                            <Save className="w-4 h-4 mr-2" />
                            {t('common.save')}
                        </Button>
                    </div>
                </TabsContent>

                {/* ── Security Tab ─────────────────────── */}
                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('settings.security.changePassword')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>{t('settings.security.currentPassword')}</Label>
                                <Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="••••••••" />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('settings.security.newPassword')}</Label>
                                <Input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} placeholder="••••••••" />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('settings.security.confirmPassword')}</Label>
                                <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="••••••••" />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handlePasswordSave} disabled={passwordSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {passwordSaving ? t('common.saving') : t('common.save')}
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ChauffeurSettingsPage;
