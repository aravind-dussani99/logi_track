import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/PageHeader';
import { Filters } from '../components/FilterPanel';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import { Trip, Advance, DailyExpense } from '../types';
import { formatCurrency } from '../utils';

type ReportType = 'trips' | 'advances' | 'expenses';
const ITEMS_PER_PAGE = 20;

const Reports: React.FC = () => {
    const { trips, advances, getDailyExpenses, getSupervisorAccounts, refreshKey } = useData();
    const [reportType, setReportType] = useState<ReportType>('trips');
    const [filters, setFilters] = useState<Filters>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [allExpenses, setAllExpenses] = useState<DailyExpense[]>([]);

    useEffect(() => {
        const fetchAllExpenses = async () => {
            const supervisors = await getSupervisorAccounts();
            const all = await Promise.all(
                supervisors.map(name => getDailyExpenses(name).then(res => res.expenses))
            );
            setAllExpenses(all.flat());
        }
        fetchAllExpenses();
    }, [getDailyExpenses, getSupervisorAccounts, refreshKey]);

    const handleExport = () => {
        let headers: string[] = [];
        let rows: (string|number)[][] = [];
        let filename = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

        switch(reportType) {
            case 'trips':
                headers = ["Date", "Vehicle", "Customer", "Material", "Quarry", "Net Weight", "Status"];
                rows = filteredData.map(d => {
                    const t = d as Trip;
                    return [t.date, t.vehicleNumber, t.customer, t.material, t.quarryName, t.netWeight, t.status];
                });
                break;
            case 'advances':
                headers = ["Date", "From", "To", "Purpose", "Amount"];
                rows = filteredData.map(d => {
                    const a = d as Advance;
                    return [a.date, a.fromAccount, a.toAccount, `"${a.purpose.replace(/"/g, '""')}"`, a.amount];
                });
                break;
            case 'expenses':
                headers = ["Date", "Supervisor", "To", "Amount", "Type"];
                 rows = filteredData.map(d => {
                    const e = d as DailyExpense;
                    return [e.date, e.from, e.to, e.amount, e.type];
                });
                break;
        }

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredData = useMemo(() => {
        let data: any[] = [];
        switch(reportType) {
            case 'trips': data = trips; break;
            case 'advances': data = advances; break;
            case 'expenses': data = allExpenses; break;
        }

        return (data || []).filter(item => {
            if (filters.dateFrom && item.date < filters.dateFrom) return false;
            if (filters.dateTo && item.date > filters.dateTo) return false;
            return true;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [reportType, filters, trips, advances, allExpenses]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [reportType]);

    const renderTable = () => {
        switch(reportType) {
            case 'trips':
                return <DataTable title="" headers={["Date", "Vehicle", "Customer", "Material", "Quarry", "Net Weight", "Status"]} data={paginatedData} renderRow={(t: Trip) => (
                    <tr key={t.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{t.vehicleNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t.material}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t.quarryName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t.netWeight} T</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t.status}</td>
                    </tr>
                )} />;
            case 'advances':
                 return <DataTable title="" headers={["Date", "From", "To", "Purpose", "Amount"]} data={paginatedData} renderRow={(a: Advance) => (
                    <tr key={a.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{a.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{a.fromAccount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{a.toAccount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{a.purpose}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-500">{formatCurrency(a.amount)}</td>
                    </tr>
                )} />;
            case 'expenses':
                 return <DataTable title="" headers={["Date", "Supervisor", "To", "Amount", "Type"]} data={paginatedData} renderRow={(e: DailyExpense) => (
                     <tr key={e.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{e.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{e.from}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{e.to}</td>
                         <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${e.type === 'DEBIT' ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(e.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{e.type}</td>
                    </tr>
                )} />;
        }
    }

    return (
         <div className="relative">
             <PageHeader
                title="Consolidated Reports"
                filters={filters}
                onFilterChange={setFilters}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }} // Simplified for now
                showFilters={['date']}
                showAddAction={false}
            />
            <main className="pt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                     <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                             <h2 className="text-xl font-semibold">Report Data</h2>
                            <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)} className="px-2 py-1 text-sm rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary">
                                <option value="trips">Trips Added</option>
                                <option value="advances">Advances</option>
                                <option value="expenses">Expenses</option>
                            </select>
                            <button onClick={handleExport} className="px-3 py-1 text-xs font-medium text-green-600 border border-green-600 rounded-md hover:bg-green-600 hover:text-white transition">
                                Export to Excel
                            </button>
                        </div>
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                    {renderTable()}
                </div>
            </main>
         </div>
    );
}

export default Reports;