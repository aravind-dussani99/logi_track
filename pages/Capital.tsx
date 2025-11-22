import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import AccountingTable from '../components/AccountingTable';
import PageHeader from '../components/PageHeader';
import { AccountSummary } from './Accounting';
import StatCard from '../components/StatCard';
import { formatCurrency } from '../utils';

const CAPITAL_CATEGORIES = ['Bank Account', 'Capital & Loans', 'Investment', 'Personal Funds'];

const Capital: React.FC = () => {
    const { trips, ledgerEntries, accounts, customers, quarries, vehicles, royaltyOwners } = useData();

    const accountSummaries = useMemo(() => {
        const summaryMap: Map<string, AccountSummary> = new Map();

        // Initialize with all relevant accounts
        accounts.filter(acc => CAPITAL_CATEGORIES.includes(acc.categoryName)).forEach(acc => {
             summaryMap.set(acc.id, { 
                id: acc.id, 
                name: acc.name, 
                type: acc.categoryName, 
                totalTrips: 0, 
                totalTonnage: 0, 
                totalAmount: 0, 
                balance: 0, 
                lastActivityDate: '' 
            });
        });

        // Process ledger entries to calculate balances
        ledgerEntries.forEach(entry => {
            const toAccount = accounts.find(a => a.name === entry.to);
            if(toAccount && summaryMap.has(toAccount.id)) {
                const summary = summaryMap.get(toAccount.id)!;
                summary.balance += (entry.type === 'DEBIT' ? -entry.amount : entry.amount);
            }
            const fromAccount = accounts.find(a => a.name === entry.from);
            if(fromAccount && summaryMap.has(fromAccount.id)) {
                const summary = summaryMap.get(fromAccount.id)!;
                summary.balance += (entry.type === 'DEBIT' ? entry.amount : -entry.amount);
            }
        });

        return Array.from(summaryMap.values());

    }, [ledgerEntries, accounts]);

    const { totalBankBalance, totalLoansPayable, totalInvestments } = useMemo(() => {
        let bank = 0;
        let loans = 0;
        let investments = 0;
        accountSummaries.forEach(acc => {
            if (acc.type === 'Bank Account') bank += acc.balance;
            if (acc.type === 'Capital & Loans') loans += acc.balance;
            if (acc.type === 'Investment') investments += acc.balance;
        });
        return { totalBankBalance: bank, totalLoansPayable: loans, totalInvestments: investments };
    }, [accountSummaries]);


    return (
        <div className="relative">
            <PageHeader
                title="Capital & Loans"
                subtitle="Track your investments, loans, bank balances, and other capital accounts."
                filters={{}}
                onFilterChange={() => {}}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }}
            />

            <main className="pt-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Bank Balance" value={formatCurrency(totalBankBalance)} icon="business-outline" color="bg-green-500" />
                    <StatCard title="Total Loans Payable" value={formatCurrency(totalLoansPayable)} icon="cash-outline" color="bg-red-500" />
                    <StatCard title="Total Investments" value={formatCurrency(totalInvestments)} icon="rocket-outline" color="bg-blue-500" />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="p-4">
                        <AccountingTable 
                            data={accountSummaries} 
                            allTrips={trips} 
                            allLedgerEntries={ledgerEntries} 
                            type="other" 
                            masterData={{customers, quarries, vehicles, royaltyOwners, accounts}}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Capital;
