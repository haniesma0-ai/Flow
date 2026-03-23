import api from './api';
import type { DashboardStats } from '@/types';

export type { DashboardStats };

const DASHBOARD_CACHE_TTL_MS = 30000;
let dashboardStatsCache: DashboardStats | null = null;
let dashboardStatsCacheAt = 0;
let dashboardStatsInFlight: Promise<DashboardStats> | null = null;

let salesStatsCache: Record<string, unknown> | null = null;
let salesStatsCacheAt = 0;
let salesStatsInFlight: Promise<Record<string, unknown>> | null = null;

let productStatsCache: Record<string, unknown> | null = null;
let productStatsCacheAt = 0;
let productStatsInFlight: Promise<Record<string, unknown>> | null = null;

export const dashboardService = {
    async getDashboardStats(options?: { force?: boolean }): Promise<DashboardStats> {
        const force = options?.force === true;
        const now = Date.now();

        if (!force && dashboardStatsCache && now - dashboardStatsCacheAt < DASHBOARD_CACHE_TTL_MS) {
            return dashboardStatsCache;
        }

        if (!force && dashboardStatsInFlight) {
            return dashboardStatsInFlight;
        }

        dashboardStatsInFlight = api.get('/stats/dashboard')
            .then((response) => {
                dashboardStatsCache = response.data;
                dashboardStatsCacheAt = Date.now();
                return response.data;
            })
            .finally(() => {
                dashboardStatsInFlight = null;
            });

        return dashboardStatsInFlight;
    },

    async getSalesStats(options?: { force?: boolean }): Promise<Record<string, unknown>> {
        const force = options?.force === true;
        const now = Date.now();

        if (!force && salesStatsCache && now - salesStatsCacheAt < DASHBOARD_CACHE_TTL_MS) {
            return salesStatsCache;
        }

        if (!force && salesStatsInFlight) {
            return salesStatsInFlight;
        }

        salesStatsInFlight = api.get('/stats/sales')
            .then((response) => {
                salesStatsCache = response.data;
                salesStatsCacheAt = Date.now();
                return response.data;
            })
            .finally(() => {
                salesStatsInFlight = null;
            });

        return salesStatsInFlight;
    },

    async getProductStats(options?: { force?: boolean }): Promise<Record<string, unknown>> {
        const force = options?.force === true;
        const now = Date.now();

        if (!force && productStatsCache && now - productStatsCacheAt < DASHBOARD_CACHE_TTL_MS) {
            return productStatsCache;
        }

        if (!force && productStatsInFlight) {
            return productStatsInFlight;
        }

        productStatsInFlight = api.get('/stats/products')
            .then((response) => {
                productStatsCache = response.data;
                productStatsCacheAt = Date.now();
                return response.data;
            })
            .finally(() => {
                productStatsInFlight = null;
            });

        return productStatsInFlight;
    },
};
