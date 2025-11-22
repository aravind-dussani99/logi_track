import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { DailyExpense } from '../types';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import { formatCurrency } from '../utils';

const ITEMS_PER_PAGE = 10;

const getMtdRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    return {
      dateFrom: formatDate(startOfMonth),
      dateTo: formatDate(today)
    };
};

const DailyExpenses: React.FC = () => {
    const { currentUser } = useAuth();
    const { getDailyExpenses, addDailyExpense, updateDailyExpense, deleteDailyExpense } = useData();
    const { openModal, closeModal } = useUI();

    const [expenses, setExpenses] = useState<DailyExpense[]>([]);
    const [openingBalance, setOpeningBalance] = useState(0);
    const [filters, setFilters] = useState<{ dateFrom?: string; dateTo?: string; destination?: string }>(getMtdRange());
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchData = useCallback(() => {
        if (currentUser) {
            getDailyExpenses(currentUser.name).then(({ expenses, openingBalance }) => {
                setExpenses(expenses);
                setOpeningBalance(openingBalance);
            });
        }
    }, [currentUser, getDailyExpenses]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    const handleAddExpense = () => {
        openModal('Add New Transaction', <ExpenseForm onSave={handleSave} onClose={closeModal} expenses={expenses} openingBalance={openingBalance} />);
    };

    const handleEditExpense = (expense: DailyExpense) => {
        openModal('Edit Transaction', <ExpenseForm onSave={handleSave} onClose={closeModal} initialData={expense} expenses={expenses} openingBalance={openingBalance} />);
    };
    
    const handleViewExpense = (expense: DailyExpense) => {
        openModal('View Transaction', <ExpenseForm onSave={() => {}} onClose={closeModal} initialData={expense} expenses={expenses} openingBalance={openingBalance} isViewMode={true} />);
    };

    const handleDeleteExpense = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            const confirmation = prompt('This action cannot be undone. Please type "DELETE" to confirm.');
            if (confirmation === 'DELETE') {
                await deleteDailyExpense(id);
                setRefreshKey(k => k + 1);
            }
        }
    };

    const handleSave = async (data: Omit<DailyExpense, 'id' | 'availableBalance' | 'closingBalance'>, id?: string) => {
        if (id) {
            await updateDailyExpense(id, data);
        } else {
            await addDailyExpense(data);
        }
        setRefreshKey(k => k + 1); // Trigger re-fetch
        closeModal();
    };

    const filteredExpenses = useMemo(() => {
        const openingBalanceEntry = { id: 'opening', date: '---', from: 'System', to: 'Opening Balance', amount: openingBalance, remarks: '', availableBalance: 0, closingBalance: openingBalance, type: 'CREDIT' as const };
        
        const allEntries = [...expenses].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const chronologicalEntries = [openingBalanceEntry, ...allEntries];

        return chronologicalEntries
            .filter(e => {
                if(e.id === 'opening') return true;
                if (filters.dateFrom && e.date < filters.dateFrom) return false;
                if (filters.dateTo && e.date > filters.dateTo) return false;
                if (filters.destination && !e.to.toLowerCase().includes(filters.destination.toLowerCase())) return false;
                return true;
            })
            .sort((a, b) => {
                if (a.date === '---') return 1;
                if (b.date === '---') return -1;
                return new Date(b.date).getTime() - new Date(a.date).getTime()
            });
    }, [expenses, filters, openingBalance]);

    const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
    const paginatedExpenses = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredExpenses, currentPage]);

    const exportToCsv = () => {
        const headers = ["Date", "From", "To", "Amount", "Type", "Remarks", "Closing Balance"];
        const rows = filteredExpenses.map(e => [
            e.date,
            e.from,
            `"${e.to.replace(/"/g, '""')}"`,
            e.amount,
            e.type,
            `"${e.remarks.replace(/"/g, '""')}"`,
            e.closingBalance
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `daily_expenses_${currentUser?.name}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const lastClosingBalance = expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.closingBalance;
    const currentBalance = lastClosingBalance !== undefined ? lastClosingBalance : openingBalance;

    return (
        <div className="relative">
             <PageHeader
                title="Daily Expenses Tracker"
                subtitle={`Current Balance: ${formatCurrency(currentBalance)}`}
                filters={filters as any}
                onFilterChange={(f) => setFilters(f as any)}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }} // Mock data, not used
                pageAction={{ label: 'Add Transaction', action: handleAddExpense }}
            />

            <main className="pt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                     <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold">Transaction History</h2>
                             <input 
                                type="text"
                                placeholder="Filter by destination..."
                                value={filters.destination || ''}
                                onChange={e => setFilters(f => ({...f, destination: e.target.value }))}
                                className="px-2 py-1 text-sm rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                             <button onClick={exportToCsv} className="px-3 py-1 text-xs font-medium text-green-600 border border-green-600 rounded-md hover:bg-green-600 hover:text-white transition">
                                Export to Excel
                            </button>
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {['Date', 'To', 'Amount', 'Remarks', 'Closing Balance', 'Actions'].map(h => 
                                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                                    )}
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedExpenses.map(expense => (
                                    <tr key={expense.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{expense.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{expense.to}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${expense.type === 'DEBIT' ? 'text-red-500' : 'text-green-500'}`}>
                                            {expense.type === 'DEBIT' ? '-' : '+'} {formatCurrency(expense.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm max-w-xs truncate">{expense.remarks}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{formatCurrency(expense.closingBalance)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {expense.id !== 'opening' && <>
                                                <button onClick={() => handleViewExpense(expense as DailyExpense)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">View</button>
                                                <button onClick={() => handleEditExpense(expense as DailyExpense)} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Edit</button>
                                                <button onClick={() => handleDeleteExpense(expense.id)} className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                                            </>}
                                        </td>
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

// --- Form Component ---

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> & {label: string, children?: React.ReactNode, isReadOnly?: boolean}> = ({ label, children, isReadOnly, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {isReadOnly ? (
             <div className="mt-1 block w-full px-3 py-2 text-gray-500 dark:text-gray-400 min-h-[42px] flex items-center bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">{props.value}</div>
        ) : props.type === 'textarea' ? (
            <textarea {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>} rows={3} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
        ) : props.type === 'select' ? (
            <select {...props as React.SelectHTMLAttributes<HTMLSelectElement>} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">{children}</select>
        ) : (
            <input {...props} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
        )}
    </div>
);

interface ExpenseFormProps {
    onSave: (data: Omit<DailyExpense, 'id' | 'availableBalance' | 'closingBalance'>, id?: string) => void;
    onClose: () => void;
    initialData?: DailyExpense;
    expenses: DailyExpense[];
    openingBalance: number;
    isViewMode?: boolean;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSave, onClose, initialData, expenses, openingBalance, isViewMode = false }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        date: initialData?.date || new Date().toISOString().split('T')[0],
        from: currentUser?.name || '',
        to: initialData?.to || '',
        amount: initialData?.amount || 0,
        remarks: initialData?.remarks || '',
        type: initialData?.type || 'DEBIT',
    });
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const allDestinations = useMemo(() => Array.from(new Set(expenses.map(e => e.to))), [expenses]);

    const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(p => ({...p, to: value}));
        if (value) {
            setSuggestions(allDestinations.filter(d => d.toLowerCase().includes(value.toLowerCase())).slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<DailyExpense, 'id' | 'availableBalance' | 'closingBalance'>, initialData?.id);
    };

    const getAvailableBalance = () => {
        if (initialData) return initialData.availableBalance;
        
        const sorted = [...expenses].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const lastExpense = sorted[sorted.length-1];
        return lastExpense ? lastExpense.closingBalance : openingBalance;
    };
    
    const availableBalance = getAvailableBalance();
    const amountChange = formData.type === 'DEBIT' ? -(Number(formData.amount) || 0) : (Number(formData.amount) || 0);
    const closingBalance = availableBalance + amountChange;
    const isLowBalance = closingBalance < (openingBalance * 0.10);

    return (
         <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="sm:col-span-2 flex justify-around p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Available Balance</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(availableBalance)}</p>
                    </div>
                     <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Closing Balance</p>
                        <p className={`text-2xl font-bold ${isLowBalance ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>{formatCurrency(closingBalance)}</p>
                    </div>
                </div>
                
                <InputField label="Date" id="date" name="date" type="date" value={formData.date} onChange={e => setFormData(p => ({...p, date: e.target.value}))} isReadOnly={isViewMode} required />
                
                <InputField label="Transaction Type" id="type" name="type" type="select" value={formData.type} onChange={e => setFormData(p => ({...p, type: e.target.value as 'DEBIT' | 'CREDIT'}))} isReadOnly={isViewMode} required>
                    <option value="DEBIT">Expense (Money Out)</option>
                    <option value="CREDIT">Money In / Top Up</option>
                </InputField>

                <InputField label="Amount" id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={e => setFormData(p => ({...p, amount: parseFloat(e.target.value) || 0}))} isReadOnly={isViewMode} required />
                
                <div className="relative">
                    <InputField label={formData.type === 'DEBIT' ? 'To (Destination)' : 'From (Source)'} id="to" name="to" type="text" value={formData.to} onChange={handleToChange} isReadOnly={isViewMode} required autoComplete="off" />
                     {suggestions.length > 0 && !isViewMode && (
                        <ul className="absolute z-10 w-full bg-white dark:bg-gray-900 border dark:border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto">
                            {suggestions.map(s => (
                                <li key={s} onClick={() => { setFormData(p => ({...p, to: s})); setSuggestions([]); }} className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{s}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="sm:col-span-2">
                    <InputField label="Remarks" id="remarks" name="remarks" type="textarea" value={formData.remarks} onChange={e => setFormData(p => ({...p, remarks: e.target.value}))} isReadOnly={isViewMode} />
                </div>
            </div>
             <div className="pt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    {isViewMode ? 'Close' : 'Cancel'}
                </button>
                {!isViewMode && (
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none">
                        Save Transaction
                    </button>
                )}
            </div>
        </form>
    )
}

export default DailyExpenses;