import React, { useState, useMemo } from 'react';
import { AccountCategory } from '../types';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 10;

const CategoriesPage: React.FC = () => {
    const { accountCategories, addAccountCategory } = useData();
    const { openModal, closeModal } = useUI();
    const [currentPage, setCurrentPage] = useState(1);
    
    const handleAddCategory = () => {
        openModal("Add New Category", <CategoryForm onSave={handleSave} onClose={closeModal} />);
    };
    
    const handleSave = async (data: Omit<AccountCategory, 'id'>) => {
        await addAccountCategory(data);
        closeModal();
    };

    const totalPages = Math.ceil(accountCategories.length / ITEMS_PER_PAGE);
    const paginatedCategories = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return accountCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [accountCategories, currentPage]);

    return (
        <div className="relative">
            <PageHeader
                title="Account Categories"
                subtitle="Manage high-level categories for your Chart of Accounts."
                filters={{}}
                onFilterChange={() => {}}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }}
                pageAction={{ label: 'Add Category', action: handleAddCategory }}
            />

            <main className="pt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                     <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold">All Categories</h2>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category Name</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedCategories.map(category => (
                                    <tr key={category.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{category.name}</td>
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
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category Name</label>
        <input {...props} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
    </div>
);

const CategoryForm: React.FC<{ onSave: (data: Omit<AccountCategory, 'id'>) => void, onClose: () => void }> = ({ onSave, onClose }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onSave({ name });
    }

    return (
         <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <InputField id="name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="pt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Cancel
                </button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none">
                    Save Category
                </button>
            </div>
        </form>
    )
}

export default CategoriesPage;