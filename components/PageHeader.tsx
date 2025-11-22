import React, { useState, useRef, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import FilterPanel, { Filters } from './FilterPanel';
import { VehicleOwner, CustomerRate, QuarryOwner, Role } from '../types';
import AddTripForm from './AddTripForm';
import AddVehicleForm from './AddVehicleForm';
import AddQuarryForm from './AddQuarryForm';
import AddCustomerForm from './AddCustomerForm';
import AddRoyaltyForm from './AddRoyaltyForm';
import AddLedgerEntryForm from './AddLedgerEntryForm';
import { useAuth } from '../contexts/AuthContext';
import SupervisorTripForm from './SupervisorTripForm';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    showFilters?: ('date' | 'transporter' | 'quarry' | 'customer' | 'vehicle' | 'royalty')[];
    showMoreFilters?: ('date' | 'transporter' | 'quarry' | 'customer' | 'vehicle' | 'royalty')[];
    filters: Filters;
    onFilterChange: (filters: Filters) => void;
    filterData: {
        vehicles: VehicleOwner[];
        customers: CustomerRate[];
        quarries: QuarryOwner[];
        royaltyOwners: string[];
    };
    pageAction?: {
        label: string;
        action: () => void;
    };
    showAddAction?: boolean;
}

const adminActions = [
    { name: 'Add Trip', icon: 'bus-outline', action: 'addTrip' },
    { name: 'Add Transport', icon: 'car-sport-outline', action: 'addVehicle' },
    { name: 'Add Quarry', icon: 'server-outline', action: 'addQuarry' },
    { name: 'Add Customer', icon: 'people-circle-outline', action: 'addCustomer' },
    { name: 'Add Royalty Owner', icon: 'document-text-outline', action: 'addRoyalty' },
    { name: 'Add Ledger Entry', icon: 'reader-outline', action: 'addLedgerEntry' },
];

const supervisorActions = [
    { name: 'Enter Trip', icon: 'document-text-outline', action: 'enterTrip' },
];

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, showFilters = [], showMoreFilters = [], filters, onFilterChange, filterData, pageAction, showAddAction = true }) => {
    const { openModal, closeModal } = useUI();
    const { currentUser } = useAuth();
    const filterPopoverRef = useRef<HTMLDivElement>(null);
    const addMenuRef = useRef<HTMLDivElement>(null);

    const [isFilterPopoverOpen, setFilterPopoverOpen] = useState(false);
    const [isAddMenuOpen, setAddMenuOpen] = useState(false);

    const isSupervisor = currentUser?.role === Role.SUPERVISOR;
    const addActions = isSupervisor ? supervisorActions : adminActions;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) setFilterPopoverOpen(false);
            if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) setAddMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleFilterChangeInternal = (key: keyof Filters, value: string) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const handleAddAction = (action: string) => {
        setAddMenuOpen(false);
        switch (action) {
            case 'enterTrip':
                openModal('Enter New Trip', <SupervisorTripForm mode="enter" onClose={closeModal} />);
                break;
            case 'addTrip':
                openModal('Add New Trip', <AddTripForm onClose={closeModal} />);
                break;
            case 'addVehicle': openModal('Add New Transport', <AddVehicleForm onClose={closeModal} />); break;
            case 'addQuarry': openModal('Add New Quarry', <AddQuarryForm onClose={closeModal} />); break;
            case 'addCustomer': openModal('Add New Customer', <AddCustomerForm onClose={closeModal} />); break;
            case 'addRoyalty': openModal('Add New Royalty Owner', <AddRoyaltyForm onClose={closeModal} />); break;
            case 'addLedgerEntry': openModal('Add New Ledger Entry', <AddLedgerEntryForm onClose={closeModal} />); break;
            default: alert(`${action} form not implemented yet.`);
        }
    };
    
    const baseInputClass = "w-full text-sm px-2 py-1 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary";
    const FilterInput: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
        <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
            {children}
        </div>
    );
    
    const uniqueTransporters = Array.from(new Set(filterData.vehicles.map(v => v.ownerName)));

    const filterComponents = {
        date: (
            <>
                <FilterInput label="Date From"><input type="date" className={baseInputClass} value={filters.dateFrom || ''} onChange={e => handleFilterChangeInternal('dateFrom', e.target.value)} /></FilterInput>
                <FilterInput label="Date To"><input type="date" className={baseInputClass} value={filters.dateTo || ''} onChange={e => handleFilterChangeInternal('dateTo', e.target.value)} /></FilterInput>
            </>
        ),
        transporter: (
            <FilterInput label="Transporter">
                <select className={baseInputClass} value={filters.transporter || ''} onChange={e => handleFilterChangeInternal('transporter', e.target.value)}>
                    <option value="">All Transporters</option>
                    {uniqueTransporters.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </FilterInput>
        ),
        quarry: (
            <FilterInput label="Quarry">
                <select className={baseInputClass} value={filters.quarry || ''} onChange={e => handleFilterChangeInternal('quarry', e.target.value)}>
                    <option value="">All Quarries</option>
                    {filterData.quarries.map(q => <option key={q.id} value={q.quarryName}>{q.quarryName}</option>)}
                </select>
            </FilterInput>
        ),
    };


    return (
        <header className="sticky top-0 bg-light dark:bg-dark py-2 z-10 border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
            <div className="flex justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-800 dark:text-white flex-shrink-0">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className="hidden lg:flex items-end gap-2 flex-grow min-w-0">
                    {showFilters.includes('date') && filterComponents.date}
                    {showFilters.includes('transporter') && filterComponents.transporter}
                    {showFilters.includes('quarry') && filterComponents.quarry}
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                    {(showFilters.length > 0 || showMoreFilters.length > 0) &&
                        <div className="relative" ref={filterPopoverRef}>
                            <button onClick={() => setFilterPopoverOpen(!isFilterPopoverOpen)} className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <ion-icon name="filter-outline" className="text-lg"></ion-icon>
                                <span className="hidden lg:inline">{showFilters.length > 0 ? "More Filters" : "Filters"}</span>
                                <span className="lg:hidden">Filters</span>
                            </button>
                            {isFilterPopoverOpen && <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border dark:border-gray-600"><FilterPanel filters={filters} setFilters={onFilterChange} data={filterData} /></div>}
                        </div>
                    }
                    {pageAction ? (
                         <button onClick={pageAction.action} className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark">
                            <ion-icon name="add-outline" className="text-xl"></ion-icon>
                            <span className="hidden md:inline">{pageAction.label}</span>
                        </button>
                    ) : (showAddAction && (
                        <div className="relative" ref={addMenuRef}>
                            <button onClick={() => setAddMenuOpen(!isAddMenuOpen)} className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark">
                                <ion-icon name="add-outline" className="text-xl"></ion-icon>
                                <span className="hidden md:inline">Add</span>
                            </button>
                            {isAddMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border dark:border-gray-600 overflow-hidden">
                                    <ul>{addActions.map(action => (<li key={action.action}><button onClick={() => handleAddAction(action.action)} className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <ion-icon name={action.icon} className="text-xl mr-3"></ion-icon><span>{action.name}</span></button></li>))}</ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </header>
    );
};

export default PageHeader;