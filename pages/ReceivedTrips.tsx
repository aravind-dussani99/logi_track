import React, { useState, useMemo, useEffect } from 'react';
import { Trip } from '../types';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import ReceiveTripForm from '../components/ReceiveTripForm';

const ITEMS_PER_PAGE = 10;

const ReceivedTrips: React.FC = () => {
    const { trips, refreshKey } = useData();
    const { openModal, closeModal } = useUI();
    const [inTransitTrips, setInTransitTrips] = useState<Trip[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const filtered = trips.filter(t => t.status === 'in transit')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setInTransitTrips(filtered);
    }, [trips, refreshKey]);
    
    const delayedTripsCount = useMemo(() => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        return inTransitTrips.filter(t => new Date(t.date) < twoDaysAgo).length;
    }, [inTransitTrips]);

    const handleReceive = (trip: Trip) => {
        openModal(`Receive Trip #${trip.id}`, <ReceiveTripForm trip={trip} onClose={closeModal} />);
    };
    
    const paginatedTrips = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return inTransitTrips.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [inTransitTrips, currentPage]);

    const totalPages = Math.ceil(inTransitTrips.length / ITEMS_PER_PAGE);

    const getDelay = (dateStr: string) => {
        const startDate = new Date(dateStr);
        const diffTime = Math.abs(new Date().getTime() - startDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    };

    const headers = ['Started', 'Vehicle No.', 'From Place', 'Customer', 'Status', 'Actions'];

    return (
        <div className="relative">
            <PageHeader
                title="Trips In Transit"
                subtitle={`${inTransitTrips.length} trips are in transit. ${delayedTripsCount > 0 ? `⚠️ ${delayedTripsCount} are delayed (>48h).` : ''}`}
                filters={{}}
                onFilterChange={() => {}}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }}
                showAddAction={false}
            />
            <main className="pt-6">
                 <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                     <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Trips to be Received</h2>
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                    <DataTable
                        title=""
                        headers={headers}
                        data={paginatedTrips}
                        renderRow={(trip: Trip) => (
                            <tr key={trip.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{trip.date} ({getDelay(trip.date)})</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{trip.vehicleNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{trip.place}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{trip.customer}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">In Transit</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                    <button onClick={() => handleReceive(trip)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Receive</button>
                                </td>
                            </tr>
                        )}
                    />
                 </div>
            </main>
        </div>
    );
};
export default ReceivedTrips;