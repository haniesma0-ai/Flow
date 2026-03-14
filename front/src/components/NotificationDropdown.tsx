import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Package, Truck, FileText, AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notificationsService, type NotificationData } from '@/services/notifications';
import { useAuth } from '@/contexts/AuthContext';

const getIcon = (type: NotificationData['type']) => {
    switch (type) {
        case 'order': return <Package className="w-4 h-4 text-blue-500" />;
        case 'delivery': return <Truck className="w-4 h-4 text-green-500" />;
        case 'invoice': return <FileText className="w-4 h-4 text-purple-500" />;
        case 'stock': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
        case 'system': return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
    }
};

const timeAgo = (dateStr: string, t: (key: string, options?: Record<string, unknown>) => string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('notifications.timeNow');
    if (minutes < 60) return t('notifications.timeMinutes', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('notifications.timeHours', { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t('notifications.timeDays', { count: days });
    return new Date(dateStr).toLocaleDateString();
};

const NotificationDropdown = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { auth } = useAuth();

    const fetchUnreadCount = useCallback(async () => {
        if (!auth.isAuthenticated) return;
        try {
            const count = await notificationsService.getUnreadCount();
            setUnreadCount(count);
        } catch {
            // silently fail
        }
    }, [auth.isAuthenticated]);

    const fetchNotifications = useCallback(async () => {
        if (!auth.isAuthenticated) return;
        setLoading(true);
        try {
            const data = await notificationsService.getAll();
            setNotifications(data);
            setUnreadCount(data.filter((n) => !n.read).length);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [auth.isAuthenticated]);

    // Poll unread count every 30 seconds
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    // Fetch full list when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (notification: NotificationData) => {
        if (!notification.read) {
            try {
                await notificationsService.markAsRead(notification.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
                );
                setUnreadCount((c) => Math.max(0, c - 1));
            } catch { /* ignore */ }
        }
        // Navigate if link provided
        if (notification.link) {
            setIsOpen(false);
            navigate(notification.link);
        }
    };

    const markAllRead = async () => {
        try {
            await notificationsService.markAllRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch { /* ignore */ }
    };

    const removeNotification = async (id: number) => {
        const wasUnread = notifications.find((n) => n.id === id && !n.read);
        try {
            await notificationsService.remove(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
        } catch { /* ignore */ }
    };

    const clearAll = async () => {
        try {
            await notificationsService.clearAll();
            setNotifications([]);
            setUnreadCount(0);
        } catch { /* ignore */ }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-semibold text-slate-900">{t('notifications.title')}</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {t('notifications.markAllRead')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="py-12 text-center">
                                <Loader2 className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-spin" />
                                <p className="text-slate-400 text-sm">Chargement...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">{t('notifications.empty')}</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => markAsRead(notification)}
                                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${!notification.read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="mt-0.5 flex-shrink-0">{getIcon(notification.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-medium ${!notification.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-1">{timeAgo(notification.createdAt, t)}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeNotification(notification.id);
                                        }}
                                        className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                            <Button
                                variant="ghost"
                                className="w-full text-sm text-slate-500 hover:text-slate-700"
                                onClick={clearAll}
                            >
                                {t('notifications.clearAll')}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
