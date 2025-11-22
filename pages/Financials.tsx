
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import { DailySummary, FinancialStatus, ChartData, Payment, CustomerRate, QuarryOwner, VehicleOwner } from '../types';
import { api } from '../services/mockApi';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { Filters } from '../components/FilterPanel';
import { formatCurrency } from '../utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Financials: React.FC = () => {
    const { currentUser } = useAuth();
    const [summary, setSummary] = useState<DailySummary | null>(null);
    const [financials, setFinancials] = useState<FinancialStatus | null>(null);
    const [profitData, setProfitData] = useState<ChartData[]>([]);
    const [costData, setCostData] = useState<ChartData[]>([]);
    const [filters, setFilters] = useState<Filters>({});
    const [filterData, setFilterData] = useState<{ vehicles: VehicleOwner[]; customers: CustomerRate[]; quarries: QuarryOwner[]; royaltyOwners: string[] }>({ vehicles: [], customers: [], quarries: [], royaltyOwners: [] });


    useEffect(() => {
        api.getDailySummary().then(setSummary);
        api.getFinancialStatus().then(setFinancials);
        api.getProfitByDay().then(setProfitData);
        api.getCostBreakdown().then(setCostData);
    }, []);

    return (
        <div className="relative">
            <PageHeader
                title="Financials"
                subtitle="An overview of your company's financial performance."
                filters={filters}
                onFilterChange={setFilters}
                filterData={filterData}
                showFilters={['date']}
            />
            
            <main className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Trips" value={summary?.totalTrips.toString() || '0'} icon="bus-outline" color="bg-blue-500" />
                    <StatCard title="Total Revenue" value={formatCurrency(summary?.totalRevenue)} icon="cash-outline" color="bg-green-500" />
                    <StatCard title="Total Cost" value={formatCurrency(summary?.totalCost)} icon="trending-down-outline" color="bg-yellow-500" />
                    <StatCard title="Total Profit" value={formatCurrency(summary?.totalProfit)} icon="trending-up-outline" color="bg-purple-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4">Financial Status</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between"><span>Customer Dues:</span> <span className="font-bold text-red-500">{formatCurrency(financials?.outstandingCustomer)}</span></div>
                            <div className="flex justify-between"><span>Transporter Dues:</span> <span className="font-bold text-yellow-500">{formatCurrency(financials?.outstandingTransporter)}</span></div>
                            <div className="flex justify-between"><span>Quarry Dues:</span> <span className="font-bold text-orange-500">{formatCurrency(financials?.outstandingQuarry)}</span></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4">Today's Cost Breakdown</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={costData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                    {costData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Weekly Profit</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={profitData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" name="Profit" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </main>
        </div>
    );
};

export default Financials;
