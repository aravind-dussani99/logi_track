import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Customer as CustomerType, RateEntry } from '../types';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import PageHeader from '../components/PageHeader';
import { Filters } from '../components/FilterPanel';
import AddCustomerForm from '../components/AddCustomerForm';
import { formatCurrency, safeToFixed } from '../utils';

const getActiveRate = (rates: RateEntry[]): RateEntry | undefined => rates.find(r => r.active === 'active');

const CustomersPage: React.FC = () => {
    const { customers, addCustomerRate, updateCustomerRate, deleteCustomerRate, quarries, materials } = useData();
    const { openModal, closeModal } = useUI();
    const [filters, setFilters] = useState<Filters>({});
    const [activePopover, setActivePopover] = useState<string | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const flatData = useMemo(() => customers.map(c => ({
        ...c,
        activeRate: getActiveRate(c.rates)
    })), [customers]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setActivePopover(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSave = async (customerId: string, data: Partial<RateEntry>) => {
        if ('id' in data) {
            await updateCustomerRate(customerId, data as RateEntry);
        } else {
            await addCustomerRate(customerId, data as Omit<RateEntry, 'id'>);
        }
        closeModal();
    };

    const handleEdit = (customer: CustomerType, rate: RateEntry) => {
        openModal(`Edit Rate for ${customer.name}`, <CustomerForm customer={customer} initialData={rate} onSave={handleSave} onClose={closeModal} />);
    };
    
    const handleAddNewRate = (customer: CustomerType) => {
         openModal(`Add New Rate for ${customer.name}`, <CustomerForm customer={customer} onSave={handleSave} onClose={closeModal} />);
    }

    const handleAddCustomer = () => {
        openModal('Add New Customer', <AddCustomerForm onClose={closeModal} />)
    }

    const handleDelete = async (customerId: string, rateId: string) => {
        if (window.confirm('Are you sure you want to delete this rate?')) {
            await deleteCustomerRate(customerId, rateId);
        }
    };
    
    const popoverData = useMemo(() => {
        if (!activePopover) return null;
        return customers.find(c => c.id === activePopover);
    }, [activePopover, customers]);

    return (
        <div className="relative">
            <PageHeader
                title="Customer Management"
                filters={filters}
                onFilterChange={setFilters}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }}
                pageAction={{ label: 'Add Customer', action: handleAddCustomer }}
            />
            
            <main className="pt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Customer Rates List</h2>
                        <p className="text-sm text-gray-500">Showing current active rate for each customer</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {['Customer', 'From Site', 'Material', 'Rate/Ton', 'Total Rate', 'Effective From', 'To', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {flatData.map(c => (
                                    <tr key={c.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{c.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{c.activeRate?.fromSite || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{c.activeRate?.materialType || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(c.activeRate?.ratePerTon)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{formatCurrency(c.activeRate?.totalRate)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{c.activeRate?.effectiveFrom || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{c.activeRate?.effectiveTo || 'Present'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {c.activeRate?.active === 'active' 
                                                ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                                : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleAddNewRate(c)} className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">New Rate</button>
                                            <button onClick={() => c.activeRate && handleEdit(c, c.activeRate)} disabled={!c.activeRate} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
                                            <button onClick={() => c.activeRate && handleDelete(c.id, c.activeRate.id)} disabled={!c.activeRate} className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
                                             <button onClick={() => setActivePopover(activePopover === c.id ? null : c.id)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Old Rates</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            {popoverData && (
                <div ref={popoverRef} className="absolute right-8 -mt-16 w-[48rem] bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-xl z-20 p-4">
                    <h4 className="font-bold mb-2">Rate History for {popoverData.name}</h4>
                    <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead><tr>{['From', 'Material', 'Rate/Ton', 'Total Rate', 'Start', 'End', 'Status'].map(h=><th key={h} className="text-left pb-1 border-b dark:border-gray-600">{h}</th>)}</tr></thead>
                            <tbody>
                                {popoverData.rates.filter(r=>r.active !== 'active').map(r => (
                                    <tr key={r.id}>
                                        <td>{r.fromSite}</td>
                                        <td>{r.materialType}</td>
                                        <td>{formatCurrency(r.ratePerTon)}</td>
                                        <td>{formatCurrency(r.totalRate)}</td>
                                        <td>{r.effectiveFrom}</td>
                                        <td>{r.effectiveTo}</td>
                                        <td>Inactive</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Form Component ---

const emptyRate: Omit<RateEntry, 'id'> = {
    fromSite: '', materialType: '', ratePerTon: 0, gst: '', gstPercentage: 0, gstAmount: 0, totalRate: 0,
    effectiveFrom: '', effectiveTo: '', active: 'active', remarks: ''
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> & {label: string, children?: React.ReactNode}> = ({ label, ...props }) => (
    <div className="col-span-1">
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {props.type === 'select' ? (
             <select {...props as React.SelectHTMLAttributes<HTMLSelectElement>} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">{props.children}</select>
        ) : props.type === 'textarea' ? (
            <textarea {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>} rows={3} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
        ) : (
             <input {...props as React.InputHTMLAttributes<HTMLInputElement>} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
        )}
    </div>
);

const CustomerForm: React.FC<{ customer: CustomerType, initialData?: Partial<RateEntry>, onSave: (customerId: string, data: Partial<RateEntry>) => void, onClose: () => void }> = ({ customer, initialData, onSave, onClose }) => {
    const { quarries, materials } = useData();
    const [formData, setFormData] = useState({ ...emptyRate, ...initialData });

    const uniqueSites = useMemo(() => Array.from(new Set(quarries.map(q => q.quarryName))), [quarries]);
    const uniqueMaterials = useMemo(() => Array.from(new Set(materials.map(m => m.name))), [materials]);


    useEffect(() => {
        const baseRate = formData.ratePerTon || 0;
        const gstPercent = formData.gstPercentage || 0;
        let total = baseRate;
        let gstAmt = 0;

        if (gstPercent > 0) {
            gstAmt = baseRate * (gstPercent / 100);
            if (formData.gst === 'exclusive') {
                total = baseRate + gstAmt;
            }
        }
        setFormData(p => ({ ...p, gstAmount: gstAmt, totalRate: total }));

    }, [formData.ratePerTon, formData.gst, formData.gstPercentage]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const val = type === 'checkbox' ? (checked ? 'active' : 'not active') : (type === 'number' && name !== 'gstPercentage') ? parseFloat(value) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(customer.id, formData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <InputField label="From Site" id="fromSite" name="fromSite" type="select" value={formData.fromSite} onChange={handleChange} required>
                    <option value="">Select Site</option>
                    {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
                </InputField>
                <InputField label="Material Type" id="materialType" name="materialType" type="select" value={formData.materialType} onChange={handleChange} required>
                    <option value="">Select Material</option>
                    {uniqueMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                </InputField>
                <InputField label="Rate per Ton" id="ratePerTon" name="ratePerTon" type="number" value={formData.ratePerTon} onChange={handleChange} required />
                
                <InputField label="GST" id="gst" name="gst" type="select" value={formData.gst} onChange={handleChange}>
                    <option value="">No GST</option>
                    <option value="inclusive">Inclusive GST</option>
                    <option value="exclusive">Exclusive GST</option>
                </InputField>
                <InputField label="GST %" id="gstPercentage" name="gstPercentage" type="number" value={formData.gstPercentage} onChange={handleChange} />
                <InputField label="GST Amount" id="gstAmount" name="gstAmount" type="number" value={safeToFixed(formData.gstAmount)} readOnly className="bg-gray-100 dark:bg-gray-700" />
                <InputField label="Total Rate" id="totalRate" name="totalRate" type="number" value={safeToFixed(formData.totalRate)} readOnly className="font-bold bg-gray-100 dark:bg-gray-700" />

                <InputField label="Effective From" id="effectiveFrom" name="effectiveFrom" type="date" value={formData.effectiveFrom} onChange={handleChange} required />
                <InputField label="Effective To" id="effectiveTo" name="effectiveTo" type="date" value={formData.effectiveTo} onChange={handleChange} />

                 <div className="sm:col-span-2 md:col-span-3">
                    <InputField label="Remarks" id="remarks" name="remarks" type="textarea" value={formData.remarks} onChange={handleChange} />
                </div>

                <div className="sm:col-span-2 md:col-span-3 flex items-center space-x-2">
                    <input type="checkbox" name="active" id="active-customer-rate" checked={formData.active === 'active'} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor="active-customer-rate">Set as Active Rate</label>
                </div>
            </div>
             <div className="pt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Cancel
                </button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none">
                    Save Rate
                </button>
            </div>
        </form>
    )
};

export default CustomersPage;
