import React, { useState, useMemo } from 'react';
import { LedgerEntry } from '../types';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import PageHeader from '../components/PageHeader';
import { Filters } from '../components/FilterPanel';
import AddLedgerEntryForm from '../components/AddLedgerEntryForm';
import Pagination from '../components/Pagination';
import StatCard from '../components/StatCard';
import { formatCurrency } from '../utils';

const ITEMS_PER_PAGE = 20;

const getMtdRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    return {
      dateFrom: formatDate(startOfMonth),
      dateTo: formatDate(today)
    };
};

const Ledger: React.FC = () => {
    const { ledgerEntries, updateLedgerEntry, deleteLedgerEntry, refreshKey } = useData();
    const [filters, setFilters] = useState<Filters>(getMtdRange());
    const [currentPage, setCurrentPage] = useState(1);
    const { openModal, closeModal } = useUI();

    const handleAddEntry = () => {
        openModal('Add New Ledger Entry', <AddLedgerEntryForm onClose={closeModal} />);
    };

    const handleEditEntry = (entry: LedgerEntry) => {
        openModal('Edit Ledger Entry', <AddLedgerEntryForm initialData={entry} onClose={closeModal} />);
    };

    const handleDeleteEntry = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
            await deleteLedgerEntry(id);
        }
    };
    
    const { filteredAndSortedEntries, totalInflow, totalOutflow } = useMemo(() => {
        const sortedEntries = [...ledgerEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let balance = 0;
        const entriesWithBalance = sortedEntries.map(entry => {
            balance = balance + (entry.type === 'CREDIT' ? entry.amount : -entry.amount);
            return { ...entry, balance };
        });

        let currentInflow = 0;
        let currentOutflow = 0;
        const filtered = entriesWithBalance.filter(entry => {
            const isInPeriod = (!filters.dateFrom || entry.date >= filters.dateFrom) && (!filters.dateTo || entry.date <= filters.dateTo);
            if (isInPeriod) {
                if (entry.type === 'CREDIT') currentInflow += entry.amount;
                else currentOutflow += entry.amount;
            }
            return isInPeriod;
        });

        return { 
            filteredAndSortedEntries: filtered.reverse(),
            totalInflow: currentInflow,
            totalOutflow: currentOutflow,
        };
    }, [ledgerEntries, filters, refreshKey]);

    const totalPages = Math.ceil(filteredAndSortedEntries.length / ITEMS_PER_PAGE);
    const paginatedEntries = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedEntries, currentPage]);


    const headers = ['Date', 'Description', 'Type', 'Amount', 'Running Balance', 'Actions'];

    return (
        <div className="relative">
            <PageHeader
                title="Main Accounts Ledger"
                subtitle="Showing recent transactions. Select a smaller date range for faster searching."
                filters={filters}
                onFilterChange={setFilters}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }}
                showFilters={['date']}
                pageAction={{ label: 'Add Entry', action: handleAddEntry }}
            />
            
            <main className="pt-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Inflow (Credit)" value={formatCurrency(totalInflow)} icon="arrow-down-circle-outline" color="bg-green-500" />
                    <StatCard title="Total Outflow (Debit)" value={formatCurrency(totalOutflow)} icon="arrow-up-circle-outline" color="bg-red-500" />
                    <StatCard title="Net Cash Flow" value={formatCurrency(totalInflow - totalOutflow)} icon="swap-horizontal-outline" color="bg-blue-500" />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                     <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold">All Transactions</h2>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {headers.map(header => <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>)}
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedEntries.map((item: LedgerEntry & { balance: number }) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            <div>{item.from} → {item.to}</div>
                                            <div className="text-xs text-gray-500">{item.remarks} ({item.paymentType})</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {item.type === 'CREDIT' ? 
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Credit</span>
                                                : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Debit</span>
                                            }
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                                            {item.type === 'CREDIT' ? '+' : '-'} {formatCurrency(item.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(item.balance)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleEditEntry(item)} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Edit</button>
                                            <button onClick={() => handleDeleteEntry(item.id)} className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Ledger;
