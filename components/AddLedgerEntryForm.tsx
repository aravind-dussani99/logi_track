import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { LedgerEntry } from '../types';

interface AddLedgerEntryFormProps {
    onClose: () => void;
    initialData?: LedgerEntry;
}

const paymentTypes = ["COMPANY MAINTENANCE", "HAND LOAN", "QUARRY", "ROYALTY BILLS", "TRANSPORT", "KSPL", "ANUDIYA", "PERSONAL", "INVESTMENT"];
const paymentSubTypes = ["ITR", "HAND LOAN NEW", "JAN QUARRY", "ROYALTY BILLS", "JAN TRANSPORT", "KSPL JAN PAYMENT", "SALARIES", "DIESEL"];

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> & {label: string, children?: React.ReactNode}> = ({ label, ...props }) => {
    const inputClass = "mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm";
    return (
        <div>
            <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            {props.type === 'select' ? (
                <select {...props as React.SelectHTMLAttributes<HTMLSelectElement>} className={inputClass}>{props.children}</select>
            ) : props.type === 'textarea' ? (
                 <textarea {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>} rows={2} className={inputClass} />
            ) : (
                <input {...props as React.InputHTMLAttributes<HTMLInputElement>} className={inputClass} />
            )}
        </div>
    );
}

const AddLedgerEntryForm: React.FC<AddLedgerEntryFormProps> = ({ onClose, initialData }) => {
    const { addLedgerEntry, updateLedgerEntry, accounts } = useData();
    const [formData, setFormData] = useState<Omit<LedgerEntry, 'id'>>({
        date: initialData?.date || new Date().toISOString().split('T')[0],
        from: initialData?.from || '',
        via: initialData?.via || '',
        to: initialData?.to || '',
        actualTo: initialData?.actualTo || '',
        amount: initialData?.amount || 0,
        toBank: initialData?.toBank || '',
        split: initialData?.split || 'NO',
        paymentSubType: initialData?.paymentSubType || '',
        paymentType: initialData?.paymentType || '',
        remarks: initialData?.remarks || '',
        type: initialData?.type || 'DEBIT',
    });
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (initialData) {
            await updateLedgerEntry(initialData.id, formData);
        } else {
            await addLedgerEntry(formData);
        }
        onClose();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData({ ...formData, [name]: type === 'number' ? parseFloat(value) || 0 : value });
    };

    return (
        <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">{initialData ? 'Edit' : 'New'} Ledger Transaction</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Record a financial transaction in the main ledger.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <InputField label="Transaction Date" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
                    <InputField label="Amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} required />
                    <InputField label="Type" name="type" type="select" value={formData.type} onChange={handleInputChange} required>
                        <option value="DEBIT">Debit (Money Out)</option>
                        <option value="CREDIT">Credit (Money In)</option>
                    </InputField>
                     <InputField label="Payment Method (Via)" name="via" type="text" placeholder="e.g., NEFT, CASH" value={formData.via} onChange={handleInputChange} />

                    <InputField label="Source (From)" name="from" type="select" value={formData.from} onChange={handleInputChange} required>
                         <option value="">Select an account...</option>
                         {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name} ({acc.categoryName})</option>)}
                    </InputField>
                     <InputField label="Destination (To)" name="to" type="select" value={formData.to} onChange={handleInputChange} required>
                        <option value="">Select an account...</option>
                         {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name} ({acc.categoryName})</option>)}
                    </InputField>
                     <InputField label="Actual Beneficiary" name="actualTo" type="text" placeholder="e.g., NEELA BABU Q" value={formData.actualTo} onChange={handleInputChange} />
                     <InputField label="Destination Bank" name="toBank" type="text" placeholder="e.g., SBIN" value={formData.toBank} onChange={handleInputChange} />

                    <InputField label="Transaction Category" name="paymentType" type="select" value={formData.paymentType} onChange={handleInputChange} required>
                        <option value="">Select a category...</option>
                        {paymentTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                    </InputField>
                    <InputField label="Transaction Sub-Category" name="paymentSubType" type="select" value={formData.paymentSubType} onChange={handleInputChange}>
                        <option value="">Select a sub-category...</option>
                         {paymentSubTypes.map(pst => <option key={pst} value={pst}>{pst}</option>)}
                    </InputField>
                    <InputField label="Split" name="split" type="text" value={formData.split} onChange={handleInputChange} />
                    
                    <div className="lg:col-span-4"><InputField label="Remarks" name="remarks" type="textarea" value={formData.remarks} onChange={handleInputChange} /></div>
                </div>
            </div>
             <div className="pt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Cancel
                </button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none">
                    Save Entry
                </button>
            </div>
        </form>
    );
};

export default AddLedgerEntryForm;