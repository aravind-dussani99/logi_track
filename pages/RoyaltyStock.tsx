

import React, { useState, useEffect, useMemo } from 'react';
import { RoyaltyStock as RoyaltyStockType } from '../types';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import PageHeader from '../components/PageHeader';
import { Filters } from '../components/FilterPanel';
import { formatCurrency, safeToFixed } from '../utils';

const RoyaltyStockPage: React.FC = () => {
    const { royaltyStock, addRoyaltyStock, trips } = useData();
    const { openModal, closeModal } = useUI();
    const [filters, setFilters] = useState<Filters>({});

    const totalPurchased = useMemo(() => royaltyStock.reduce((acc, item) => acc + item.quantity, 0), [royaltyStock]);
    const totalUsed = useMemo(() => trips.reduce((acc, trip) => acc + trip.royaltyM3, 0), [trips]);
    const balance = totalPurchased - totalUsed;

    const handleAddPurchase = () => {
        openModal("Add Royalty Purchase", <RoyaltyStockForm onSave={handleSave} onClose={closeModal} />);
    }

    const handleSave = async (data: Omit<RoyaltyStockType, 'id'>) => {
        await addRoyaltyStock(data);
        closeModal();
    }

    return (
        <div className="relative">
            <PageHeader
                title="Royalty Stock"
                subtitle={`Current Balance: ${safeToFixed(balance)} m³`}
                filters={filters}
                onFilterChange={setFilters}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }}
                pageAction={{ label: 'Add Purchase', action: handleAddPurchase }}
            />

            <main className="pt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 border-b dark:border-gray-700">
                        <h2 className="text-xl font-semibold">Purchase History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {['Purchase Date', 'Quantity (m³)', 'Cost (₹)'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {royaltyStock.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{item.purchaseDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{safeToFixed(item.quantity)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(item.cost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input {...props} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
    </div>
);

const RoyaltyStockForm: React.FC<{ onSave: (data: Omit<RoyaltyStockType, 'id'>) => void, onClose: () => void }> = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({ purchaseDate: '', quantity: '', cost: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            purchaseDate: formData.purchaseDate,
            quantity: parseFloat(formData.quantity) || 0,
            cost: parseFloat(formData.cost) || 0,
        });
    }

    return (
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField label="Purchase Date" id="purchaseDate" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} required />
                <InputField label="Quantity (m³)" id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
                <div className="sm:col-span-2">
                    <InputField label="Total Cost (₹)" id="cost" name="cost" type="number" value={formData.cost} onChange={handleChange} required />
                </div>
            </div>
            <div className="pt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Cancel
                </button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none">
                    Save Purchase
                </button>
            </div>
        </form>
    );
};


export default RoyaltyStockPage;
