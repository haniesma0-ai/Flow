import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Save, Building2, User, Bell, Shield, CreditCard,
  Mail, Phone, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { auth } = useAuth();
  const user = auth.user;

  const [activeTab, setActiveTab] = useState('company');

  // Company form
  const [company, setCompany] = useState(() => {
    const stored = localStorage.getItem('companySettings');
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return {
      name: 'Fox Petroleum SARL',
      ice: '002890653000024',
      email: 'contactus@fox-petroleum.com',
      phone: '+212 522 243 030',
      address: 'Résidence Al Azizia Boulevard Royaume Arabie Saoudite 3ème Etage N°20 TANGER',
      tva: '20',
      currency: 'MAD',
      paymentDelay: '30',
    };
  });

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

  // Notifications
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('notificationPrefs');
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return {
      newOrders: true,
      deliveriesComplete: true,
      lowStock: true,
      paymentsReceived: false,
      overdueInvoices: true,
    };
  });

  const handleCompanySave = () => {
    localStorage.setItem('companySettings', JSON.stringify(company));
    toast.success(t('settings.toast.companySaved'));
  };

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

  const handleNotificationsSave = () => {
    localStorage.setItem('notificationPrefs', JSON.stringify(notifications));
    toast.success(t('settings.toast.notificationsSaved'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h2>
        <p className="text-slate-600 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="company">
            <Building2 className="w-4 h-4 mr-2" />
            {t('settings.tabs.company')}
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            {t('settings.tabs.profile')}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            {t('settings.tabs.notifications')}
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            {t('settings.tabs.security')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.company.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('settings.company.name')}</Label>
                  <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.company.ice')}</Label>
                  <Input value={company.ice} onChange={(e) => setCompany({ ...company, ice: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label><Mail className="w-4 h-4 inline mr-1" />{t('settings.company.email')}</Label>
                  <Input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label><Phone className="w-4 h-4 inline mr-1" />{t('settings.company.phone')}</Label>
                  <Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label><MapPin className="w-4 h-4 inline mr-1" />{t('settings.company.address')}</Label>
                <textarea
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.company.financialTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label><CreditCard className="w-4 h-4 inline mr-1" />{t('settings.company.tva')}</Label>
                  <Input type="number" value={company.tva} onChange={(e) => setCompany({ ...company, tva: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.company.currency')}</Label>
                  <select
                    value={company.currency}
                    onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="MAD">{t('settings.company.currencyMAD')}</option>
                    <option value="EUR">{t('settings.company.currencyEUR')}</option>
                    <option value="USD">{t('settings.company.currencyUSD')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.company.paymentDelay')}</Label>
                  <Input type="number" value={company.paymentDelay} onChange={(e) => setCompany({ ...company, paymentDelay: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleCompanySave}>
              <Save className="w-4 h-4 mr-2" />
              {t('common.save')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profile.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{user?.name}</p>
                  <p className="text-sm text-slate-500">{user?.role}</p>
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
                  <Label>{t('settings.profile.phone')}</Label>
                  <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.profile.language')}</Label>
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

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notifications.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: 'newOrders' as const, label: t('settings.notifications.newOrders'), desc: t('settings.notifications.newOrdersDesc') },
                { key: 'deliveriesComplete' as const, label: t('settings.notifications.deliveriesComplete'), desc: t('settings.notifications.deliveriesCompleteDesc') },
                { key: 'lowStock' as const, label: t('settings.notifications.lowStock'), desc: t('settings.notifications.lowStockDesc') },
                { key: 'paymentsReceived' as const, label: t('settings.notifications.paymentsReceived'), desc: t('settings.notifications.paymentsReceivedDesc') },
                { key: 'overdueInvoices' as const, label: t('settings.notifications.overdueInvoices'), desc: t('settings.notifications.overdueInvoicesDesc') },
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

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.security.twoFactorTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{t('settings.security.enable2fa')}</p>
                  <p className="text-sm text-slate-500">
                    {t('settings.security.enable2faDesc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
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

export default SettingsPage;