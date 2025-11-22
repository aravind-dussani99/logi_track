import React from 'react';
import FilterPanel, { Filters } from './FilterPanel';
import { VehicleOwner, CustomerRate, QuarryOwner } from '../types';

interface FilterSidebarProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    data: {
        vehicles: VehicleOwner[];
        customers: CustomerRate[];
        quarries: QuarryOwner[];
        royaltyOwners: string[];
    }
    isVisible: boolean;
    setVisible: (visible: boolean) => void;
}

const DashboardFilterSidebar: React.FC<FilterSidebarProps> = ({ filters, setFilters, data, isVisible, setVisible }) => {
    
    const filterContent = (
        <FilterPanel filters={filters} setFilters={setFilters} data={data} />
    );

    return (
       <>
        {/* Mobile Filter Overlay */}
        <div className={`fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity lg:hidden ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setVisible(false)}></div>
        
        {/* Mobile Filter Sidebar */}
        <aside className={`fixed top-0 left-0 z-40 w-64 h-full bg-white dark:bg-gray-800 shadow-xl transform transition-transform lg:hidden ${isVisible ? 'translate-x-0' : '-translate-x-full'}`}>
            {filterContent}
        </aside>

        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-md self-start">
            {filterContent}
        </aside>
       </>
    );
};

export default DashboardFilterSidebar;