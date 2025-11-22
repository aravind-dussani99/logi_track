import React, { useEffect, useState, useMemo } from 'react';
import { Trip } from '../../types';
import { api } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import PageHeader from '../../components/PageHeader';
import { useUI } from '../../contexts/UIContext';
import SupervisorTripForm from '../../components/SupervisorTripForm';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';

const SUPERVISOR_TRIPS_PER_PAGE = 10;

const getMtdRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    return {
      dateFrom: formatDate(startOfMonth),
      dateTo: formatDate(today)
    };
};

const SupervisorTripReport: React.FC = () => {
    const { currentUser } = useAuth();
    const { trips, refreshKey, deleteTrip } = useData();
    const { openModal, closeModal } = useUI();
    const [myTrips, setMyTrips] = useState<Trip[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<{dateFrom?: string; dateTo?: string}>(getMtdRange());
    
    useEffect(() => {
        if (currentUser) {
            const supervisorTrips = trips.filter(trip => trip.createdBy === currentUser.name)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setMyTrips(supervisorTrips);
        }
    }, [trips, currentUser, refreshKey]);
    
    const filteredTrips = useMemo(() => {
        return myTrips.filter(trip => {
            if (filters.dateFrom && trip.date < filters.dateFrom) return false;
            if (filters.dateTo && trip.date > filters.dateTo) return false;
            return true;
        });
    }, [myTrips, filters]);

    const paginatedTrips = useMemo(() => {
        const startIndex = (currentPage - 1) * SUPERVISOR_TRIPS_PER_PAGE;
        return filteredTrips.slice(startIndex, startIndex + SUPERVISOR_TRIPS_PER_PAGE);
    }, [filteredTrips, currentPage]);

    const totalPages = Math.ceil(filteredTrips.length / SUPERVISOR_TRIPS_PER_PAGE);

    const handleEnterTrip = () => {
        openModal('Enter New Trip', <SupervisorTripForm mode="enter" onClose={closeModal} />);
    };
    
    const handleUpload = (trip: Trip) => {
        openModal('Upload Trip Documents', <SupervisorTripForm mode="upload" trip={trip} onClose={closeModal} />);
    };
    
    const handleEdit = (trip: Trip) => {
        openModal('Edit Trip', <SupervisorTripForm mode="edit" trip={trip} onClose={closeModal} />);
    };
    
    const handleView = (trip: Trip) => {
        openModal('View Trip Details', <SupervisorTripForm mode="view" trip={trip} onClose={closeModal} />);
    };

    const handleDelete = async (tripId: number) => {
        if (window.confirm('Are you sure you want to delete this trip entry?')) {
            await deleteTrip(tripId);
        }
    };

    const getStatusBadge = (status: Trip['status']) => {
        switch(status) {
            case 'pending upload': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending Upload</span>;
            case 'in transit': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">In Transit</span>;
            case 'pending validation': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Pending Validation</span>;
            case 'completed': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
            default: return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>
        }
    }
    
    const headers = ['Date', 'Vehicle No.', 'Customer', 'Status', 'Actions'];

    return (
        <div className="relative">
            <PageHeader
                title="Enter Trips"
                subtitle={`You have entered ${myTrips.length} trips.`}
                filters={{}}
                onFilterChange={() => {}}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }}
                pageAction={{ label: 'Enter Trip', action: handleEnterTrip }}
            />
            <main className="pt-6">
                 <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                     <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold">My Trip Entries</h2>
                            <div className="flex items-center gap-2">
                                <label className="text-sm">From:</label>
                                <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="px-2 py-1 text-sm rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"/>
                                <label className="text-sm">To:</label>
                                <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="px-2 py-1 text-sm rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"/>
                            </div>
                        </div>
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{trip.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{trip.vehicleNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{trip.customer}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(trip.status)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                {trip.status === 'pending upload' ? (
                                    <>
                                        <button onClick={() => handleUpload(trip)} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Upload</button>
                                        <button onClick={() => handleEdit(trip)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Edit</button>
                                        <button onClick={() => handleDelete(trip.id)} className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                                    </>
                                ) : trip.status === 'in transit' ? (
                                    <>
                                        <button onClick={() => handleView(trip)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">View</button>
                                        <button onClick={() => handleEdit(trip)} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Edit</button>
                                        <button onClick={() => handleDelete(trip.id)} className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                                    </>
                                ) : (
                                     <button onClick={() => handleView(trip)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">View</button>
                                )}
                                </td>
                            </tr>
                        )}
                    />
                 </div>
            </main>
        </div>
    );
}

export default SupervisorTripReport;