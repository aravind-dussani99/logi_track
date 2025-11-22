import React, { useState, useMemo } from 'react';
import { AccountSummary } from '../pages/Accounting';
import { Trip, QuarryOwner, LedgerEntry, VehicleOwner, Customer, RoyaltyOwner, Account } from '../types';
import Pagination from './Pagination';
import { formatCurrency, safeToFixed } from '../utils';

const ITEMS_PER_PAGE = 10;

interface AccountingTableProps {
    data: AccountSummary[];
    allTrips: Trip[];
    allLedgerEntries: LedgerEntry[];
    type: 'payable' | 'receivable' | 'aged' | 'other';
    masterData: {
        customers: Customer[];
        quarries: QuarryOwner[];
        vehicles: VehicleOwner[];
        royaltyOwners: RoyaltyOwner[];
        accounts: Account[];
    }
}

const AccountingTable: React.FC<AccountingTableProps> = ({ data, allTrips, allLedgerEntries, type, masterData }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [data, currentPage]);

    const handleRowClick = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const getTransactionsForEntity = (entity: AccountSummary) => {
        const { id: entityId, type: entityType } = entity;
        const allAccounts = masterData.accounts;

        const entityTrips = allTrips.filter(trip => {
            if (entityType === 'Customer') return masterData.customers.find(c => c.name === trip.customer)?.id === entityId;
            if (entityType === 'Vendor-Transport') return masterData.vehicles.find(v => v.ownerName === trip.transporterName)?.id === entityId;
            if (entityType === 'Vendor-Quarry') return masterData.quarries.find(q => q.ownerName === entity.name)?.id === entityId;
            if (entityType === 'Vendor-Royalty') return masterData.royaltyOwners.find(r => r.ownerName === trip.royaltyOwnerName)?.id === entityId;
            return false;
        }).map(trip => {
            let debit = 0;
            if (entityType === 'Vendor-Quarry') debit = trip.materialCost;
            else if (entityType === 'Vendor-Transport') debit = trip.transportCost;
            else if (entityType === 'Vendor-Royalty') debit = trip.royaltyCost;
            
            return {
                date: trip.date,
                description: `Trip: ${trip.vehicleNumber} - ${safeToFixed(trip.tonnage)} T`,
                credit: entityType === 'Customer' ? trip.revenue : 0,
                debit: debit,
                type: 'Trip'
            };
        });
        
        const entityLedgerEntries = allLedgerEntries.filter(entry => {
            const fromId = allAccounts.find(a => a.name === entry.from)?.id;
            const toId = allAccounts.find(a => a.name === entry.to)?.id;
            return fromId === entityId || toId === entityId;
        }).map(entry => {
            const fromId = allAccounts.find(a => a.name === entry.from)?.id;
            const isDebitForThisAccount = fromId === entityId; // Money went FROM this account
            return {
                date: entry.date,
                description: `Ledger: ${entry.from} -> ${entry.to} (${entry.remarks})`,
                credit: !isDebitForThisAccount ? entry.amount : 0,
                debit: isDebitForThisAccount ? entry.amount : 0,
                type: 'Payment'
            }
        });

        const transactions = [...entityTrips, ...entityLedgerEntries]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
        let runningBalance = entity.balance - transactions.reduce((acc, t) => acc + t.credit - t.debit, 0);

        return transactions.map(t => {
            runningBalance += t.credit - t.debit;
            return { ...t, balance: runningBalance };
        });
    };
    
    const exportToCsv = (entity: AccountSummary, transactions: any[]) => {
        const headers = ["Date", "Description", "Type", "Credit (₹)", "Debit (₹)", "Balance (₹)"];
        const rows = transactions.map(t => [
            t.date, 
            `"${t.description.replace(/"/g, '""')}"`, 
            t.type, 
            t.credit, 
            t.debit,
            t.balance
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `ledger_${entity.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderDetailTable = (entity: AccountSummary) => {
        const transactions = getTransactionsForEntity(entity);

        if (transactions.length === 0) {
            return <div className="p-4 text-center text-sm text-gray-500">No trip data available for this period. Balance is based on opening balance.</div>;
        }

        return (
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Transaction Ledger for {entity.name}</h4>
                    <button onClick={() => exportToCsv(entity, transactions)} className="px-3 py-1 text-xs font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition">
                        Export CSV
                    </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full text-xs">
                        <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                            <tr>
                                {['Date', 'Description', 'Type', 'Credit (₹)', 'Debit (₹)', 'Balance (₹)'].map(h => 
                                    <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {transactions.map((t, index) => (
                                <tr key={index}>
                                    <td className="px-2 py-2">{t.date}</td>
                                    <td className="px-2 py-2">{t.description}</td>
                                    <td className="px-2 py-2">{t.type}</td>
                                    <td className="px-2 py-2 text-green-500">{t.credit > 0 ? formatCurrency(t.credit) : '-'}</td>
                                    <td className="px-2 py-2 text-red-500">{t.debit > 0 ? formatCurrency(t.debit) : '-'}</td>
                                    <td className="px-2 py-2 font-semibold">{formatCurrency(t.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const headers = {
        default: ['Name', 'Category', 'Total Trips', 'Total Tonnage', `Amount ${type === 'payable' ? 'Due' : 'Receivable'}`],
        other: ['Account Name', 'Category', 'Balance'],
        aged: ['Name', 'Category', 'Last Activity', 'Balance']
    };
    
    const getHeaders = () => {
        if(type === 'other') return headers.other;
        if(type === 'aged') return headers.aged;
        return headers.default;
    }


    if (data.length === 0) {
        return <p className="p-4 text-center text-gray-500 dark:text-gray-400">No data available for this category.</p>;
    }

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="w-8"></th>
                            {getHeaders().map(header => (
                                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.map(item => (
                            <React.Fragment key={item.id}>
                                <tr onClick={() => handleRowClick(item.id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-2">
                                        <ion-icon className="text-lg" name={expandedRow === item.id ? 'chevron-down-outline' : 'chevron-forward-outline'}></ion-icon>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.type}</td>
                                    {type !== 'other' && type !== 'aged' && (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.totalTrips}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{safeToFixed(item.totalTonnage)} T</td>
                                        </>
                                    )}
                                    {type === 'aged' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.lastActivityDate || 'N/A'}</td>
                                    )}
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${item.balance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {formatCurrency(Math.abs(item.balance))}
                                    </td>
                                </tr>
                                {expandedRow === item.id && (
                                    <tr>
                                        <td colSpan={getHeaders().length + 1}>
                                            {renderDetailTable(item)}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
};

export default AccountingTable;