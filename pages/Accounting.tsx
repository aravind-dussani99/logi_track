import React from 'react';
import { useState, useMemo } from 'react';
import { Trip, QuarryOwner, VehicleOwner, Customer, RoyaltyOwner, LedgerEntry, Account } from '../types';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import { Filters } from '../components/FilterPanel';
import { useData } from '../contexts/DataContext';
import AccountingTable from '../components/AccountingTable';

const getMtdRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    return {
      dateFrom: formatDate(startOfMonth),
      dateTo: formatDate(today)
    };
};

export interface AccountSummary {
    id: string; // This will now be the unique ID from the source object
    name: string;
    type: string;
    totalTrips: number;
    totalTonnage: number;
    totalAmount: number;
    balance: number;
    lastActivityDate: string;
}

const Accounting: React.FC = () => {
    const { trips: allTrips, quarries, vehicles, customers, royaltyOwners, ledgerEntries, accounts } = useData();
    const [filters, setFilters] = useState<Filters>(getMtdRange());
    const [activeTab, setActiveTab] = useState<'vp' | 'vr' | 'cr' | 'others' | 'aged'>('vp');

    const allDataForFilters = useMemo(() => {
        const uniqueRoyaltyOwnersNames = Array.from(new Set(allTrips.map(t => t.royaltyOwnerName)));
        const customerRates = customers.map(c => ({ customer: c.name, id: c.id, material: '', rate: '', from: '', to: '', active: false, rejectionPercent: '', rejectionRemarks: '', locationFrom: '', locationTo: '' }));
        return { quarries, vehicles, customers: customerRates, royaltyOwners: uniqueRoyaltyOwnersNames };
    }, [allTrips, quarries, vehicles, customers]);
    
    const filteredTrips = useMemo(() => {
        return allTrips.filter(trip => {
            if (filters.dateFrom && trip.date < filters.dateFrom) return false;
            if (filters.dateTo && trip.date > filters.dateTo) return false;
            return true;
        });
    }, [allTrips, filters]);

    const filteredLedgerEntries = useMemo(() => {
        return ledgerEntries.filter(entry => {
            if (filters.dateFrom && entry.date < filters.dateFrom) return false;
            if (filters.dateTo && entry.date > filters.dateTo) return false;
            return true;
        });
    }, [ledgerEntries, filters]);
    
    // Create lookup maps for efficient ID retrieval
    const masterDataMaps = useMemo(() => {
        const customerNameToId = new Map(customers.map(c => [c.name, c.id]));
        const vehicleNumberToOwnerId = new Map(vehicles.map(v => [v.vehicleNumber, v.id]));
        const quarryNameToOwnerId = new Map(quarries.map(q => [q.quarryName, q.id]));
        const royaltyNameToId = new Map(royaltyOwners.map(r => [r.ownerName, r.id]));
        const accountNameToId = new Map(accounts.map(a => [a.name, a.id]));
        return { customerNameToId, vehicleNumberToOwnerId, quarryNameToOwnerId, royaltyNameToId, accountNameToId };
    }, [customers, vehicles, quarries, royaltyOwners, accounts]);

    const accountSummaries = useMemo(() => {
        const summaryMap: Map<string, AccountSummary> = new Map();

        // Initialize with all accounts and their opening balances
        accounts.forEach(acc => {
             summaryMap.set(acc.id, { 
                id: acc.id, 
                name: acc.name, 
                type: acc.categoryName, 
                totalTrips: 0, 
                totalTonnage: 0, 
                totalAmount: 0, 
                balance: 0, // Opening balance will be added later
                lastActivityDate: '' 
            });
        });
        
        // Add opening balances from master data
        [...customers, ...quarries, ...vehicles, ...royaltyOwners].forEach(entity => {
            const summary = summaryMap.get(entity.id);
            if(summary) summary.balance = entity.openingBalance || 0;
        });

        // Process filtered trips
        filteredTrips.forEach(trip => {
            const customerId = masterDataMaps.customerNameToId.get(trip.customer);
            if (customerId) {
                const summary = summaryMap.get(customerId);
                if (summary) {
                    summary.balance += trip.revenue;
                    summary.totalAmount += trip.revenue;
                    summary.totalTrips += 1;
                    summary.totalTonnage += trip.tonnage;
                }
            }

            const quarryOwnerId = masterDataMaps.quarryNameToOwnerId.get(trip.quarryName);
            if (quarryOwnerId) {
                const summary = summaryMap.get(quarryOwnerId);
                if (summary) {
                    summary.balance -= trip.materialCost;
                    summary.totalAmount += trip.materialCost;
                    summary.totalTrips += 1;
                    summary.totalTonnage += trip.tonnage;
                }
            }
            
            const transporterId = masterDataMaps.vehicleNumberToOwnerId.get(trip.vehicleNumber);
            if (transporterId) {
                const summary = summaryMap.get(transporterId);
                if (summary) {
                    summary.balance -= trip.transportCost;
                    summary.totalAmount += trip.transportCost;
                    summary.totalTrips += 1;
                    summary.totalTonnage += trip.tonnage;
                }
            }

            const royaltyId = masterDataMaps.royaltyNameToId.get(trip.royaltyOwnerName);
            if (royaltyId) {
                const summary = summaryMap.get(royaltyId);
                if(summary){
                    summary.balance -= trip.royaltyCost;
                    summary.totalAmount += trip.royaltyCost;
                    // Royalty tonnage is m3, not included in main tonnage
                }
            }
        });

        // Process filtered ledger entries using account names to find IDs
        filteredLedgerEntries.forEach(entry => {
            const toId = masterDataMaps.accountNameToId.get(entry.to);
            if(toId) {
                const summary = summaryMap.get(toId);
                if(summary) {
                    summary.balance += (entry.type === 'DEBIT' ? -entry.amount : entry.amount);
                }
            }
            const fromId = masterDataMaps.accountNameToId.get(entry.from);
            if(fromId) {
                const summary = summaryMap.get(fromId);
                if(summary) {
                    summary.balance += (entry.type === 'DEBIT' ? entry.amount : -entry.amount);
                }
            }
        });

        // Determine last activity date (simplified - could be improved for performance)
        const allTransactions = [...allTrips, ...ledgerEntries].sort((a,b) => b.date.localeCompare(a.date));
        summaryMap.forEach(summary => {
            const lastTx = allTransactions.find(tx => {
                if ('customer' in tx) { // It's a trip
                    return masterDataMaps.customerNameToId.get(tx.customer) === summary.id ||
                           masterDataMaps.vehicleNumberToOwnerId.get(tx.vehicleNumber) === summary.id ||
                           masterDataMaps.quarryNameToOwnerId.get(tx.quarryName) === summary.id ||
                           masterDataMaps.royaltyNameToId.get(tx.royaltyOwnerName) === summary.id;
                } else { // It's a ledger entry
                    return masterDataMaps.accountNameToId.get(tx.from) === summary.id ||
                           masterDataMaps.accountNameToId.get(tx.to) === summary.id;
                }
            });
            if (lastTx) summary.lastActivityDate = lastTx.date;
        });

        return Array.from(summaryMap.values());

    }, [filteredTrips, filteredLedgerEntries, allTrips, ledgerEntries, accounts, masterDataMaps]);
    
    const { vendorPayables, vendorReceivables, customerReceivables, otherExpenses, agedBalances } = useMemo(() => {
        const vp: AccountSummary[] = [];
        const vr: AccountSummary[] = [];
        const cr: AccountSummary[] = [];
        const others: AccountSummary[] = [];
        const aged: AccountSummary[] = [];
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        accountSummaries.forEach(acc => {
             const hasBalance = Math.abs(acc.balance) > 0.01;
             if (!hasBalance && acc.totalTrips === 0) return;

            if (acc.type === 'Vendor-Quarry' || acc.type === 'Vendor-Transport' || acc.type === 'Vendor-Royalty') {
                if (acc.balance < 0) vp.push(acc); 
                else if (acc.balance > 0) vr.push(acc);
            } else if (acc.type === 'Customer') {
                if (acc.balance > 0) cr.push(acc);
            } else {
                others.push(acc);
            }

            const isInactive = !acc.lastActivityDate || new Date(acc.lastActivityDate) < thirtyDaysAgo;
            if (hasBalance && isInactive) {
                aged.push(acc);
            }
        });
        return { vendorPayables: vp, vendorReceivables: vr, customerReceivables: cr, otherExpenses: others, agedBalances: aged };
    }, [accountSummaries]);
    
    const dateRangeSubtitle = useMemo(() => {
        if (!filters.dateFrom || !filters.dateTo) return "Showing all transactions";
        const from = new Date(filters.dateFrom + 'T00:00:00').toLocaleDateString();
        const to = new Date(filters.dateTo + 'T00:00:00').toLocaleDateString();
        return `Showing transactions from ${from} to ${to}`;
    }, [filters.dateFrom, filters.dateTo]);

    const totalPayable = vendorPayables.reduce((sum, p) => sum + Math.abs(p.balance), 0);
    const totalReceivable = customerReceivables.reduce((sum, r) => sum + r.balance, 0);
    const totalAgedBalance = agedBalances.reduce((sum, b) => sum + Math.abs(b.balance), 0);

    const tabs = [
        { id: 'vp', label: `Vendor Payables (${vendorPayables.length})` },
        { id: 'vr', label: `Vendor Receivables (${vendorReceivables.length})` },
        { id: 'cr', label: `Customer Receivables (${customerReceivables.length})` },
        { id: 'others', label: `Others & Expenses (${otherExpenses.length})`},
        { id: 'aged', label: `Aged Balances (${agedBalances.length})` },
    ];

    return (
        <div className="relative">
            <PageHeader
                title="Accounting"
                subtitle={dateRangeSubtitle}
                filters={filters}
                onFilterChange={setFilters}
                filterData={allDataForFilters}
                showFilters={['date']}
            />
            
            <main className="pt-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Payables" value={`₹${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="arrow-up-circle-outline" color="bg-red-500" comparisonText="Amount owed to vendors" />
                    <StatCard title="Total Receivables" value={`₹${totalReceivable.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="arrow-down-circle-outline" color="bg-green-500" comparisonText="Amount owed by customers" />
                    <StatCard title="Total Aged Balance" value={`₹${totalAgedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="time-outline" color="bg-yellow-500" comparisonText="Follow-up required" />
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-6 px-6 overflow-x-auto" aria-label="Tabs">
                             {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                        ? 'border-primary text-primary dark:border-blue-400 dark:text-blue-300'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-4">
                        {activeTab === 'vp' && <AccountingTable data={vendorPayables} allTrips={allTrips} allLedgerEntries={ledgerEntries} type="payable" masterData={{customers, quarries, vehicles, royaltyOwners, accounts}} />}
                        {activeTab === 'vr' && <AccountingTable data={vendorReceivables} allTrips={allTrips} allLedgerEntries={ledgerEntries} type="receivable" masterData={{customers, quarries, vehicles, royaltyOwners, accounts}}/>}
                        {activeTab === 'cr' && <AccountingTable data={customerReceivables} allTrips={allTrips} allLedgerEntries={ledgerEntries} type="receivable" masterData={{customers, quarries, vehicles, royaltyOwners, accounts}}/>}
                        {activeTab === 'others' && <AccountingTable data={otherExpenses} allTrips={allTrips} allLedgerEntries={ledgerEntries} type="other" masterData={{customers, quarries, vehicles, royaltyOwners, accounts}}/>}
                        {activeTab === 'aged' && <AccountingTable data={agedBalances} allTrips={allTrips} allLedgerEntries={ledgerEntries} type="aged" masterData={{customers, quarries, vehicles, royaltyOwners, accounts}}/>}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Accounting;