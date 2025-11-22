import React, { useEffect, useState, useMemo } from 'react';
import DataTable from '../components/DataTable';
import { Trip, Role, QuarryOwner, VehicleOwner, Customer, CustomerRate } from '../types';
import { api } from '../services/mockApi';
import { useAuth } from '../contexts/AuthContext';
import { Filters } from '../components/FilterPanel';
import Pagination from '../components/Pagination';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/PageHeader';
import { safeToFixed } from '../utils';

const TRIPS_PER_PAGE = 20;

const getMtdRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    return {
      dateFrom: formatDate(startOfMonth),
      dateTo: formatDate(today)
    };
};

const DailyTrips: React.FC = () => {
    const { currentUser } = useAuth();
    const { refreshKey, customers } = useData();
    const [allTrips, setAllTrips] = useState<Trip[]>([]);
    const [allData, setAllData] = useState<{ quarries: QuarryOwner[]; vehicles: VehicleOwner[]; customers: CustomerRate[], royaltyOwners: string[] }>({ quarries: [], vehicles: [], customers: [], royaltyOwners: [] });
    
    const [filters, setFilters] = useState<Filters>(getMtdRange());
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        api.getTrips().then(setAllTrips);
        Promise.all([api.getQuarryOwners(), api.getVehicleOwners()]).then(([quarries, vehicles]) => {
            const uniqueRoyaltyOwners = Array.from(new Set(allTrips.map(t => t.royaltyOwnerName)));
            const customerRates = customers.map(c => ({ customer: c.name, id: c.id, material: '', rate: '', from: '', to: '', active: false, rejectionPercent: '', rejectionRemarks: '', locationFrom: '', locationTo: '' }));
            setAllData({ quarries, vehicles, customers: customerRates, royaltyOwners: uniqueRoyaltyOwners });
        });
    }, [refreshKey, allTrips, customers]);

    const filteredTrips = useMemo(() => {
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        if (toDate) toDate.setHours(23, 59, 59, 999);
        
        const filtered = allTrips.filter(trip => {
            const tripDate = new Date(trip.date);
            
            if (fromDate && tripDate < fromDate) return false;
            if (toDate && tripDate > toDate) return false;
            if (filters.vehicle && trip.vehicleNumber !== filters.vehicle) return false;
            if (filters.transporter && trip.transporterName !== filters.transporter) return false;
            if (filters.customer && trip.customer !== filters.customer) return false;
            if (filters.quarry && trip.quarryName !== filters.quarry) return false;
            if (filters.royalty && trip.royaltyOwnerName !== filters.royalty) return false;
            return true;
        });

        if (currentPage !== 1) {
            setCurrentPage(1);
        }
        return filtered;
    }, [allTrips, filters]);

    const paginatedTrips = useMemo(() => {
        const startIndex = (currentPage - 1) * TRIPS_PER_PAGE;
        return filteredTrips.slice(startIndex, startIndex + TRIPS_PER_PAGE);
    }, [filteredTrips, currentPage]);

    const totalPages = Math.ceil(filteredTrips.length / TRIPS_PER_PAGE);

    const headers = ['Date', 'Vehicle No.', 'Customer', 'Material', 'Quarry', 'Net Weight'];

    const dateRangeSubtitle = useMemo(() => {
        if (!filters.dateFrom && !filters.dateTo) return "Showing all trips";
        const from = filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00').toLocaleDateString() : 'the beginning';
        const to = filters.dateTo ? new Date(filters.dateTo + 'T00:00:00').toLocaleDateString() : 'today';
        return `Showing data from ${from} to ${to}`;
    }, [filters.dateFrom, filters.dateTo]);

    return (
        <div className="relative">
            <PageHeader
                title="Daily Trips"
                subtitle={dateRangeSubtitle}
                filters={filters}
                onFilterChange={setFilters}
                filterData={allData}
                showFilters={['date', 'transporter', 'quarry']}
                showMoreFilters={['vehicle', 'customer', 'royalty']}
            />

            <main className="pt-6">
                <DataTable
                    title="All Trips"
                    headers={headers}
                    data={paginatedTrips}
                    renderRow={(trip: Trip) => (
                        <tr key={trip.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{trip.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{trip.vehicleNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{trip.customer}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{trip.material}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{trip.quarryName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{safeToFixed(trip.netWeight)} T</td>
                        </tr>
                    )}
                />
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </main>
        </div>
    );
};

export default DailyTrips;