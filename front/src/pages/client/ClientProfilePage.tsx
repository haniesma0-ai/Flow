import { useState } from 'react';
import { Save, User, Shield, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';

const ClientProfilePage = () => {
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

    const handleProfileSave = async () => {
        setProfileSaving(true);
        try {
            const response = await api.put('/auth/profile', {
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
            });
            // Update local storage
            const storedAuth = localStorage.getItem('auth');
            if (storedAuth) {
                const parsed = JSON.parse(storedAuth);
                parsed.user = { ...parsed.user, ...response.data };
                localStorage.setItem('auth', JSON.stringify(parsed));
            }
            toast.success('Profil mis à jour avec succès');
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { email?: string[]; error?: string } } };
            const msg =
                axiosErr.response?.data?.email?.[0] ||
                axiosErr.response?.data?.error ||
                'Erreur lors de la mise à jour';
            toast.error(msg);
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordSave = async () => {
        if (passwords.newPassword !== passwords.confirm) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }
        if (passwords.newPassword.length < 8) {
            toast.error('Le mot de passe doit faire au moins 8 caractères');
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
            toast.success('Mot de passe modifié avec succès');
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                'Erreur lors du changement de mot de passe';
            toast.error(msg);
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Mon Profil</h2>
                <p className="text-slate-600 mt-1">
                    Gérez vos informations personnelles et votre sécurité
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                    <TabsTrigger value="profile">
                        <User className="w-4 h-4 mr-2" />
                        Profil
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Shield className="w-4 h-4 mr-2" />
                        Sécurité
                    </TabsTrigger>
                </TabsList>

                {/* ─── Profile Tab ─────────────────────────────── */}
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations personnelles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                                    <User className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{user?.name}</p>
                                    <p className="text-sm text-slate-500 capitalize">{user?.role}</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Nom complet</Label>
                                    <Input
                                        value={profile.name}
                                        onChange={(e) =>
                                            setProfile({ ...profile, name: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) =>
                                            setProfile({ ...profile, email: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Téléphone</Label>
                                    <Input
                                        value={profile.phone}
                                        onChange={(e) =>
                                            setProfile({ ...profile, phone: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Langue</Label>
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
                            {profileSaving ? 'Sauvegarde...' : 'Enregistrer'}
                        </Button>
                    </div>
                </TabsContent>

                {/* ─── Security Tab ────────────────────────────── */}
                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <KeyRound className="w-5 h-5" />
                                Changer le mot de passe
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Mot de passe actuel</Label>
                                <Input
                                    type="password"
                                    value={passwords.current}
                                    onChange={(e) =>
                                        setPasswords({ ...passwords, current: e.target.value })
                                    }
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nouveau mot de passe</Label>
                                <Input
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={(e) =>
                                        setPasswords({ ...passwords, newPassword: e.target.value })
                                    }
                                    placeholder="••••••••"
                                />
                                <p className="text-xs text-slate-500">
                                    Minimum 8 caractères
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Confirmer le nouveau mot de passe</Label>
                                <Input
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={(e) =>
                                        setPasswords({ ...passwords, confirm: e.target.value })
                                    }
                                    placeholder="••••••••"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handlePasswordSave} disabled={passwordSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {passwordSaving ? 'Sauvegarde...' : 'Changer le mot de passe'}
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ClientProfilePage;
