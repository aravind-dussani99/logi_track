import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { Trip, Role, QuarryOwner, VehicleOwner, Customer, CustomerRate, RoyaltyOwner } from '../types';
import { api } from '../services/mockApi';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Filters } from '../components/FilterPanel';
import Pagination from '../components/Pagination';
import PageHeader from '../components/PageHeader';
import { safeToFixed } from '../utils';
import SupervisorTripReport from './Supervisor/TripReport';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
const TRIPS_PER_PAGE = 10;
const MAX_CHART_DAYS = 31;

type Stats = {
    totalTrips: number;
    totalTonnage: number;
    totalRoyaltyUsed: number;
    totalReduction: number;
};

const getMtdRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    return {
      dateFrom: formatDate(startOfMonth),
      dateTo: formatDate(today)
    };
};

const Dashboard: React.FC = () => {
    const { currentUser } = useAuth();
    
    if (currentUser?.role === Role.SUPERVISOR) {
        return <SupervisorTripReport />;
    }
    
    const { trips, quarries, vehicles, customers, royaltyOwners } = useData();
    
    const [filters, setFilters] = useState<Filters>(getMtdRange());
    const [currentPage, setCurrentPage] = useState(1);
    const [chartWarning, setChartWarning] = useState<string | null>(null);
    
    const [pieDimension, setPieDimension] = useState<'transporter' | 'quarry' | 'customer'>('transporter');

    const allDataForFilter = useMemo(() => {
        const uniqueRoyaltyOwnerNames = Array.from(new Set(royaltyOwners.map(r => r.ownerName)));
        const customerRatesForFilter = customers.map(c => ({
            id: c.id,
            customer: c.name,
            material: '', rate: '', from: '', to: '', active: false, rejectionPercent: '', rejectionRemarks: '', locationFrom: '', locationTo: ''
        }));

        return {
            quarries,
            vehicles,
            customers: customerRatesForFilter,
            royaltyOwners: uniqueRoyaltyOwnerNames,
        };
    }, [quarries, vehicles, customers, royaltyOwners]);


    const calculateStatsForPeriod = (trips: Trip[]): Stats => {
         return trips.reduce((acc, trip) => {
            acc.totalTonnage += trip.tonnage;
            acc.totalRoyaltyUsed += trip.royaltyTons;
            acc.totalReduction += (trip.grossWeight - trip.netWeight);
            return acc;
        }, { totalTrips: trips.length, totalTonnage: 0, totalRoyaltyUsed: 0, totalReduction: 0 });
    };

    const { filteredTrips, previousPeriodTrips, dateRangeSubtitle } = useMemo(() => {
        if (!filters.dateFrom || !filters.dateTo) {
            return { filteredTrips: [], previousPeriodTrips: [], dateRangeSubtitle: 'Loading...' };
        }

        const currentPeriodTrips = trips.filter(trip => {
            if (filters.dateFrom && trip.date < filters.dateFrom) return false;
            if (filters.dateTo && trip.date > filters.dateTo) return false;
            if (filters.vehicle && trip.vehicleNumber !== filters.vehicle) return false;
            if (filters.transporter && trip.transporterName !== filters.transporter) return false;
            if (filters.customer && trip.customer !== filters.customer) return false;
            if (filters.quarry && trip.quarryName !== filters.quarry) return false;
            if (filters.royalty && trip.royaltyOwnerName !== filters.royalty) return false;
            return true;
        });

        const from = new Date(filters.dateFrom + 'T00:00:00');
        const to = new Date(filters.dateTo + 'T00:00:00');
        
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        const isMtd = filters.dateFrom === formatDate(startOfMonth) && filters.dateTo === formatDate(today);

        let prevStartDate: Date, prevEndDate: Date;
        if (isMtd) {
            prevStartDate = new Date(from.getFullYear(), from.getMonth() - 1, 1);
            prevEndDate = new Date(to.getFullYear(), to.getMonth() - 1, to.getDate());
        } else {
            const duration = to.getTime() - from.getTime();
            prevEndDate = new Date(from.getTime() - (1000 * 60 * 60 * 24)); // One day before
            prevStartDate = new Date(prevEndDate.getTime() - duration);
        }

        const prevStartDateStr = formatDate(prevStartDate);
        const prevEndDateStr = formatDate(prevEndDate);

        const prevPeriodTrips = trips.filter(trip => {
            if (trip.date < prevStartDateStr || trip.date > prevEndDateStr) return false;
            if (filters.vehicle && trip.vehicleNumber !== filters.vehicle) return false;
            if (filters.transporter && trip.transporterName !== filters.transporter) return false;
            if (filters.customer && trip.customer !== filters.customer) return false;
            if (filters.quarry && trip.quarryName !== filters.quarry) return false;
            if (filters.royalty && trip.royaltyOwnerName !== filters.royalty) return false;
            return true;
        });

        const formatDateForDisplay = (dateStr: string) => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const subtitle = isMtd
            ? `Showing data for Month to Date (${formatDateForDisplay(filters.dateFrom)} - ${formatDateForDisplay(filters.dateTo)})`
            : `Showing data for ${formatDateForDisplay(filters.dateFrom)} - ${formatDateForDisplay(filters.dateTo)}`;

        return { filteredTrips: currentPeriodTrips, previousPeriodTrips: prevPeriodTrips, dateRangeSubtitle: subtitle };

    }, [trips, filters]);

    const filteredStats = useMemo(() => calculateStatsForPeriod(filteredTrips), [filteredTrips]);
    const previousPeriodStats = useMemo(() => calculateStatsForPeriod(previousPeriodTrips), [previousPeriodTrips]);
    
    const calculateComparison = (current: number, previous: number, unit: string, invert: boolean = false): { text: string; color: 'text-green-500' | 'text-red-500' | ''; isIncrease: boolean } => {
        const diff = current - previous;
        if (Math.abs(diff) < 0.01) return { text: 'No change vs previous period', color: '', isIncrease: false };
        
        const isIncrease = diff > 0;
        const text = `${safeToFixed(Math.abs(diff), 1)} ${unit} ${isIncrease ? 'more' : 'less'} vs previous period`;
        
        let isPositiveTrend = isIncrease;
        if (invert) isPositiveTrend = !isPositiveTrend;
        const color = isPositiveTrend ? 'text-green-500' : 'text-red-500';
        
        return { text, color, isIncrease };
    };

    const tripsComparison = useMemo(() => calculateComparison(filteredStats.totalTrips, previousPeriodStats.totalTrips, 'trips'), [filteredStats, previousPeriodStats]);
    const tonnageComparison = useMemo(() => calculateComparison(filteredStats.totalTonnage, previousPeriodStats.totalTonnage, 'T'), [filteredStats, previousPeriodStats]);
    const royaltyComparison = useMemo(() => calculateComparison(filteredStats.totalRoyaltyUsed, previousPeriodStats.totalRoyaltyUsed, 'T'), [filteredStats, previousPeriodStats]);
    const reductionComparison = useMemo(() => calculateComparison(filteredStats.totalReduction, previousPeriodStats.totalReduction, 'T', true), [filteredStats, previousPeriodStats]);

    const filteredTripsByDay = useMemo(() => {
        const dailyCounts: { [key: string]: number } = {};
        filteredTrips.forEach(trip => { dailyCounts[trip.date] = (dailyCounts[trip.date] || 0) + 1; });
        const sortedData = Object.entries(dailyCounts).map(([name, value]) => ({ name, value })).sort((a,b) => a.name.localeCompare(b.name));

        if (sortedData.length > MAX_CHART_DAYS) {
            setChartWarning(`Displaying the last ${MAX_CHART_DAYS} days. The selected range is too large for a clear daily view.`);
            return sortedData.slice(-MAX_CHART_DAYS);
        } else {
            setChartWarning(null);
            return sortedData;
        }
    }, [filteredTrips]);

    const filteredPieData = useMemo(() => {
        const dimensionCounts: { [key: string]: number } = {};
        const key = pieDimension === 'transporter' ? 'transporterName' : pieDimension === 'quarry' ? 'quarryName' : 'customer';
        filteredTrips.forEach(trip => { const name = trip[key]; dimensionCounts[name] = (dimensionCounts[name] || 0) + 1; });
        return Object.entries(dimensionCounts).map(([name, value]) => ({ name, value }));
    }, [filteredTrips, pieDimension]);

    const recent30Trips = useMemo(() => filteredTrips.slice(0, 30), [filteredTrips]);
    const totalPages = Math.ceil(recent30Trips.length / TRIPS_PER_PAGE);
    const paginatedRecentTrips = useMemo(() => {
        const startIndex = (currentPage - 1) * TRIPS_PER_PAGE;
        return recent30Trips.slice(startIndex, startIndex + TRIPS_PER_PAGE);
    }, [recent30Trips, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [filters]);
    
    if (currentUser?.role === Role.DRIVER) return <div>Driver Dashboard Coming Soon...</div>;

    return (
        <div className="relative">
             <PageHeader
                title="Dashboard"
                subtitle={dateRangeSubtitle}
                filters={filters}
                onFilterChange={setFilters}
                filterData={allDataForFilter}
                showFilters={['date', 'transporter', 'quarry']}
                showMoreFilters={['vehicle', 'customer', 'royalty']}
            />
            
            <main className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Trips" value={`${filteredStats.totalTrips}`} icon="bus-outline" color="bg-blue-500" comparisonText={tripsComparison.text} comparisonColor={tripsComparison.color} isIncrease={tripsComparison.isIncrease} />
                    <StatCard title="Total Tonnage" value={`${safeToFixed(filteredStats.totalTonnage, 1)} T`} icon="scale-outline" color="bg-green-500" comparisonText={tonnageComparison.text} comparisonColor={tonnageComparison.color} isIncrease={tonnageComparison.isIncrease} />
                    <StatCard title="Total Royalty Used" value={`${safeToFixed(filteredStats.totalRoyaltyUsed, 1)} T`} icon="document-text-outline" color="bg-purple-500" comparisonText={royaltyComparison.text} comparisonColor={royaltyComparison.color} isIncrease={royaltyComparison.isIncrease} />
                    <StatCard title="Total Reduction" value={`${safeToFixed(filteredStats.totalReduction, 1)} T`} icon="trending-down-outline" color="bg-red-500" comparisonText={reductionComparison.text} comparisonColor={reductionComparison.color} isIncrease={reductionComparison.isIncrease} />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-wrap gap-2">
                        <div>
                             <h2 className="text-xl font-semibold">Recent Trips</h2>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Showing the last 30 filtered trips. Click 'Show All' for the complete history.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            <Link to="/trips" className="text-sm font-medium text-primary hover:underline flex-shrink-0">Show All</Link>
                        </div>
                    </div>
                    <div className="overflow-x-auto"><table className="min-w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr>{['Date', 'Vehicle', 'Material', 'Customer', 'Tonnage'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}</tr></thead><tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">{paginatedRecentTrips.map((trip) => (<tr key={trip.id}><td className="px-6 py-4 whitespace-nowrap text-sm">{trip.date}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{trip.vehicleNumber}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{trip.material}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{trip.customer}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{safeToFixed(trip.tonnage)} T</td></tr>))}</tbody></table></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold mb-1">Daily Trip Counts</h3>
                        {chartWarning && <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-3">{chartWarning}</p>}
                        <ResponsiveContainer width="100%" height={300}><BarChart data={filteredTripsByDay}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#1E40AF" name="Trips" /></BarChart></ResponsiveContainer>
                    </div>
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Trips by</h3><select value={pieDimension} onChange={e => setPieDimension(e.target.value as any)} className="text-sm rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:border-primary focus:ring-primary"><option value="transporter">Transporter</option><option value="quarry">Quarry</option><option value="customer">Customer</option></select></div>
                        <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={filteredPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" labelLine={false} label={({ name, percent }) => `${name} ${safeToFixed((Number(percent || 0) * 100), 0)}%`}>{filteredPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
