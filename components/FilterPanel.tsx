import React from 'react';
import { VehicleOwner, CustomerRate, QuarryOwner } from '../types';

export interface Filters {
    dateFrom?: string;
    dateTo?: string;
    vehicle?: string;
    transporter?: string;
    customer?: string;
    quarry?: string;
    royalty?: string;
}

interface FilterPanelProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    data: {
        vehicles: VehicleOwner[];
        customers: CustomerRate[];
        quarries: QuarryOwner[];
        royaltyOwners: string[];
    }
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters, data }) => {
    const { vehicles, customers, quarries, royaltyOwners } = data;
    const uniqueTransporters = Array.from(new Set(vehicles.map(v => v.ownerName)));
    const uniqueCustomers = Array.from(new Set(customers.map(c => c.customer)));

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        setFilters({
            dateFrom: formatDate(startOfMonth),
            dateTo: formatDate(today)
        });
    };

    const baseInputClass = "mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm";
    const dateInputClass = `${baseInputClass} pr-8`;

    return (
         <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 dark:border-gray-600">Filters</h3>
            
            <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date From</label>
                <div className="relative">
                    <input type="date" id="dateFrom" className={dateInputClass} value={filters.dateFrom || ''} onChange={e => handleFilterChange('dateFrom', e.target.value)} />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ion-icon name="calendar-outline" className="text-gray-400"></ion-icon>
                    </div>
                </div>
            </div>
            <div>
                <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date To</label>
                <div className="relative">
                    <input type="date" id="dateTo" className={dateInputClass} value={filters.dateTo || ''} onChange={e => handleFilterChange('dateTo', e.target.value)} />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ion-icon name="calendar-outline" className="text-gray-400"></ion-icon>
                    </div>
                </div>
            </div>
            
             <div>
                <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle</label>
                <select id="vehicle" className={baseInputClass} value={filters.vehicle || ''} onChange={e => handleFilterChange('vehicle', e.target.value)}>
                    <option value="">All Vehicles</option>
                    {vehicles.map(v => <option key={v.id} value={v.vehicleNumber}>{v.vehicleNumber}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="transporter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transporter</label>
                <select id="transporter" className={baseInputClass} value={filters.transporter || ''} onChange={e => handleFilterChange('transporter', e.target.value)}>
                    <option value="">All Transporters</option>
                    {uniqueTransporters.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                <select id="customer" className={baseInputClass} value={filters.customer || ''} onChange={e => handleFilterChange('customer', e.target.value)}>
                    <option value="">All Customers</option>
                    {uniqueCustomers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="quarry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quarry</label>
                <select id="quarry" className={baseInputClass} value={filters.quarry || ''} onChange={e => handleFilterChange('quarry', e.target.value)}>
                    <option value="">All Quarries</option>
                    {quarries.map(q => <option key={q.id} value={q.quarryName}>{q.quarryName}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="royalty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Royalty</label>
                <select id="royalty" className={baseInputClass} value={filters.royalty || ''} onChange={e => handleFilterChange('royalty', e.target.value)}>
                    <option value="">All Royalty</option>
                    {royaltyOwners.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            
            <div className="pt-4">
                <button onClick={resetFilters} className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">Reset</button>
            </div>
        </div>
    );
};

export default FilterPanel;