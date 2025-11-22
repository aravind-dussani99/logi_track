import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { Advance } from '../types';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import AdvanceForm from '../components/AdvanceForm';
import { api } from '../services/mockApi';
import { formatCurrency } from '../utils';
import { Filters } from '../components/FilterPanel';

const ITEMS_PER_PAGE = 10;

const AdvancesPage: React.FC = () => {
    const { advances, deleteAdvance } = useData();
    const { openModal, closeModal } = useUI();
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<Filters>({});

    const handleAddAdvance = () => {
        openModal('Add New Advance', <AdvanceForm onClose={closeModal} />);
    };

    const handleEdit = (advance: Advance) => {
        openModal('Edit Advance', <AdvanceForm advance={advance} onClose={closeModal} />);
    }

    const handleDelete = async (id: string) => {
        if(window.confirm('Are you sure you want to delete this advance record?')) {
            await deleteAdvance(id);
        }
    }
    
    const filteredAdvances = useMemo(() => {
        return advances.filter(a => {
            if (filters.dateFrom && a.date < filters.dateFrom) return false;
            if (filters.dateTo && a.date > filters.dateTo) return false;
            return true;
        })
    }, [advances, filters]);
    
    const paginatedAdvances = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAdvances.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAdvances, currentPage]);

    const totalPages = Math.ceil(filteredAdvances.length / ITEMS_PER_PAGE);
    
    const exportToCsv = () => {
        const headers = ["Date", "From", "To", "Purpose", "Amount", "Linked Trip"];
        const rows = filteredAdvances.map(a => [
            a.date,
            a.fromAccount,
            a.toAccount,
            `"${a.purpose.replace(/"/g, '""')}"`,
            a.amount,
            a.tripId ? `Trip #${a.tripId}` : 'Manual'
        ]);
         const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `advances_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const headers = ['Date', 'To', 'Purpose', 'Amount', 'Actions'];

    return (
        <div className="relative">
            <PageHeader
                title="Advances"
                subtitle="Track advance payments made for trips."
                filters={filters}
                onFilterChange={setFilters}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }}
                showFilters={['date']}
                pageAction={{ label: 'Add Advance', action: handleAddAdvance }}
            />
            <main className="pt-6">
                 <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                     <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold">Advance History</h2>
                            <button onClick={exportToCsv} className="px-3 py-1 text-xs font-medium text-green-600 border border-green-600 rounded-md hover:bg-green-600 hover:text-white transition">
                                Export to Excel
                            </button>
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
                        data={paginatedAdvances}
                        renderRow={(advance: Advance) => (
                            <tr key={advance.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{advance.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{advance.toAccount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{advance.purpose}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-500">{formatCurrency(advance.amount)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button onClick={() => handleEdit(advance)} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Edit</button>
                                    <button onClick={() => handleDelete(advance.id)} className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                                </td>
                            </tr>
                        )}
                    />
                 </div>
            </main>
        </div>
    );
};

export default AdvancesPage;