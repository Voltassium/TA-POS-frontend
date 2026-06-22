import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

export const ROLES = {
    SUPERADMIN: 'superadmin',
    OWNER: 'owner',
    CHEF: 'chef',
    STAFF: 'staff'
} as const;

/**
 * Default redirect per role setelah login.
 * Digunakan jika user mencoba akses halaman yang tidak diizinkan.
 */
export const ROLE_DEFAULT_PATH: Record<string, string> = {
    superadmin: '/',
    owner: '/',
    chef: '/kitchen',
    staff: '/pages/order'
};

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: { roles: [ROLES.SUPERADMIN, ROLES.OWNER] }
                },
                {
                    path: '/pages/category',
                    name: 'category',
                    component: () => import('@/views/pages/Category.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/pages/product-kulakan',
                    name: 'product-kulakan',
                    component: () => import('@/views/pages/ProductKulakan.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/pages/product-olahan',
                    name: 'product-olahan',
                    component: () => import('@/views/pages/ProductOlahan.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/pages/order-history',
                    name: 'orderHistory',
                    component: () => import('@/views/pages/OrderHistory.vue'),
                    meta: { roles: [ROLES.SUPERADMIN, ROLES.OWNER, ROLES.STAFF] }
                },
                {
                    path: '/pages/stock-history',
                    name: 'stockHistory',
                    component: () => import('@/views/pages/StockHistory.vue'),
                    meta: { roles: [ROLES.SUPERADMIN, ROLES.OWNER, ROLES.STAFF] }
                },
                {
                    path: '/pages/order',
                    name: 'order',
                    component: () => import('@/views/pages/Order.vue'),
                    meta: { roles: [ROLES.SUPERADMIN, ROLES.STAFF] }
                },
                {
                    path: '/kitchen',
                    name: 'kitchen',
                    component: () => import('@/views/pages/Kitchen.vue'),
                    meta: { roles: [ROLES.SUPERADMIN, ROLES.CHEF] }
                },
                {
                    path: '/pages/pengeluaran',
                    name: 'pengeluaran',
                    component: () => import('@/views/pages/Pengeluaran.vue'),
                    meta: { roles: [ROLES.SUPERADMIN, ROLES.OWNER] }
                },
                {
                    path: '/pages/manajemen-akun',
                    name: 'manajemenAkun',
                    component: () => import('@/views/pages/ManajemenAkun.vue'),
                    meta: { roles: [ROLES.SUPERADMIN, ROLES.OWNER] }
                },
                // ---- Halaman UI Kit & Utilities (superadmin only) ----
                {
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/views/uikit/FormLayout.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/input',
                    name: 'input',
                    component: () => import('@/views/uikit/InputDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/views/uikit/ButtonDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/views/uikit/TableDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/views/uikit/ListDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/views/uikit/TreeDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/views/uikit/PanelsDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/overlay',
                    name: 'overlay',
                    component: () => import('@/views/uikit/OverlayDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/views/uikit/MediaDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/views/uikit/MessagesDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/views/uikit/FileDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/views/uikit/MenuDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/ChartDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/misc',
                    name: 'misc',
                    component: () => import('@/views/uikit/MiscDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/uikit/timeline',
                    name: 'timeline',
                    component: () => import('@/views/uikit/TimelineDoc.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/blocks/free',
                    name: 'blocks',
                    meta: {
                        breadcrumb: ['Prime Blocks', 'Free Blocks'],
                        roles: [ROLES.SUPERADMIN]
                    },
                    component: () => import('@/views/utilities/Blocks.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/pages/crud',
                    name: 'crud',
                    component: () => import('@/views/pages/Crud.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                },
                {
                    path: '/start/documentation',
                    name: 'documentation',
                    component: () => import('@/views/pages/Documentation.vue'),
                    meta: { roles: [ROLES.SUPERADMIN] }
                }
            ]
        },
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/register',
            name: 'register',
            component: () => import('@/views/pages/auth/Register.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        }
    ]
});

const publicPaths = ['/auth/login', '/auth/register', '/auth/access', '/auth/error', '/pages/notfound', '/landing'];

/**
 * Decode JWT payload tanpa verifikasi signature.
 * Digunakan untuk membaca role dari token secara cepat di guard.
 */
function getRoleFromToken(token: string): string | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(payload)) as Record<string, unknown>;
        return (decoded.role as string) ?? null;
    } catch {
        return null;
    }
}

router.beforeEach((to) => {
    const token = localStorage.getItem('access_token');
    const isAuthenticated = !!token;

    if (publicPaths.includes(to.path)) {
        if ((to.path === '/auth/login' || to.path === '/auth/register') && isAuthenticated) {
            const role = getRoleFromToken(token!) ?? 'staff';
            return { path: ROLE_DEFAULT_PATH[role] ?? '/' };
        }
        return;
    }

    if (!isAuthenticated) {
        return { path: '/auth/login' };
    }

    const requiredRoles = to.meta?.roles as string[] | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
        const userRole = getRoleFromToken(token!) ?? '';
        if (!requiredRoles.includes(userRole)) {
            return { path: '/auth/access' };
        }
    }
});

export default router;
