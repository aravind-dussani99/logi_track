import React, { useState, useMemo } from 'react';
import { Account, AccountCategory } from '../types';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 20;

const Accounts: React.FC = () => {
    const { accounts, addAccount, accountCategories } = useData();
    const { openModal, closeModal } = useUI();
    const [currentPage, setCurrentPage] = useState(1);
    
    const handleAddAccount = () => {
        openModal("Add New Account", <AccountForm categories={accountCategories} onSave={handleSave} onClose={closeModal} />);
    };
    
    const handleSave = async (data: Omit<Account, 'id'>) => {
        await addAccount(data);
        closeModal();
    };

    const totalPages = Math.ceil(accounts.length / ITEMS_PER_PAGE);
    const paginatedAccounts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return accounts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [accounts, currentPage]);

    return (
        <div className="relative">
            <PageHeader
                title="Chart of Accounts"
                subtitle="Manage all financial entities, vendors, customers, and expense categories."
                filters={{}}
                onFilterChange={() => {}}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }}
                pageAction={{ label: 'Add Account', action: handleAddAccount }}
            />

            <main className="pt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                     <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold">All Accounts</h2>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {['Account Name', 'Category'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedAccounts.map(account => (
                                    <tr key={account.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{account.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{account.categoryName}</td>
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


// Form Component
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> & {label: string, children?: React.ReactNode}> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {props.type === 'select' ? (
             <select {...props as React.SelectHTMLAttributes<HTMLSelectElement>} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">{props.children}</select>
        ) : (
             <input {...props as React.InputHTMLAttributes<HTMLInputElement>} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
        )}
    </div>
);

const AccountForm: React.FC<{ categories: AccountCategory[], onSave: (data: Omit<Account, 'id'>) => void, onClose: () => void }> = ({ categories, onSave, onClose }) => {
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const category = categories.find(c => c.id === categoryId);
        if (!name || !category) return;
        onSave({ name, categoryId, categoryName: category.name });
    }

    return (
         <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                    <InputField label="Account Name" id="name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="sm:col-span-2">
                     <InputField label="Account Category" id="categoryId" name="categoryId" type="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                        <option value="">Select a Category</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </InputField>
                </div>
            </div>
            <div className="pt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Cancel
                </button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none">
                    Save Account
                </button>
            </div>
        </form>
    )
}

export default Accounts;