import api from './axiosInstance';

export interface SalesData {
    date: string;
    total: number;
}

export interface TopSellingProduct {
    product_id: number;
    product_name: string;
    category_name: string;
    quantity: number;
}

export interface DashboardStats {
    total_orders: number;
    total_revenue: number;
    total_profit: number;
    total_expenses: number;
}

export interface DashboardResponse {
    stats: DashboardStats;
    sales_chart: SalesData[];
    top_products: TopSellingProduct[];
}

export const statisticsApi = {
    getDashboardData: async (range: 'daily' | 'weekly' | 'monthly' | 'all' = 'daily') => {
        const response = await api.get('/statistics/dashboard', { params: { range } });
        return response.data;
    }
};
