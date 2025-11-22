import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RoyaltyOwner as RoyaltyOwnerType, RateEntry } from '../types';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import PageHeader from '../components/PageHeader';
import { Filters } from '../components/FilterPanel';
import AddRoyaltyForm from '../components/AddRoyaltyForm';
import { formatCurrency, safeToFixed } from '../utils';

const getActiveRate = (rates: RateEntry[]): RateEntry | undefined => rates.find(r => r.active === 'active');

const RoyaltyPage: React.FC = () => {
    const { royaltyOwners, addRoyaltyRate, updateRoyaltyRate, deleteRoyaltyRate } = useData();
    const { openModal, closeModal } = useUI();
    const [filters, setFilters] = useState<Filters>({});
    const [activePopover, setActivePopover] = useState<string | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const flatData = useMemo(() => royaltyOwners.map(ro => ({
        ...ro,
        activeRate: getActiveRate(ro.rates)
    })), [royaltyOwners]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setActivePopover(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSave = async (royaltyId: string, data: Partial<RateEntry>) => {
        if ('id' in data) {
            await updateRoyaltyRate(royaltyId, data as RateEntry);
        } else {
            await addRoyaltyRate(royaltyId, data as Omit<RateEntry, 'id'>);
        }
        closeModal();
    };

    const handleEdit = (royaltyOwner: RoyaltyOwnerType, rate: RateEntry) => {
        openModal(`Edit Rate for ${royaltyOwner.ownerName}`, <RoyaltyForm royaltyOwner={royaltyOwner} initialData={rate} onSave={handleSave} onClose={closeModal} />);
    };
    
    const handleAddNewRate = (royaltyOwner: RoyaltyOwnerType) => {
         openModal(`Add New Rate for ${royaltyOwner.ownerName}`, <RoyaltyForm royaltyOwner={royaltyOwner} onSave={handleSave} onClose={closeModal} />);
    }

    const handleAddRoyaltyOwner = () => {
        openModal('Add New Royalty Owner', <AddRoyaltyForm onClose={closeModal} />);
    }

    const handleDelete = async (royaltyId: string, rateId: string) => {
        if (window.confirm('Are you sure you want to delete this rate?')) {
            await deleteRoyaltyRate(royaltyId, rateId);
        }
    };
    
    const popoverData = useMemo(() => {
        if (!activePopover) return null;
        return royaltyOwners.find(ro => ro.id === activePopover);
    }, [activePopover, royaltyOwners]);

    return (
        <div className="relative">
            <PageHeader
                title="Royalty Management"
                filters={filters}
                onFilterChange={setFilters}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }}
                pageAction={{ label: 'Add Owner', action: handleAddRoyaltyOwner }}
            />
            
            <main className="pt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Royalty Rates List</h2>
                         <p className="text-sm text-gray-500">Showing current active rate for each owner</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {['Owner', 'From Site', 'Material', 'Rate/m³', 'Total Rate', 'Effective From', 'To', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {flatData.map(ro => (
                                    <tr key={ro.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{ro.ownerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{ro.activeRate?.fromSite || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{ro.activeRate?.materialType || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(ro.activeRate?.ratePerM3)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{formatCurrency(ro.activeRate?.totalRate)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{ro.activeRate?.effectiveFrom || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{ro.activeRate?.effectiveTo || 'Present'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {ro.activeRate?.active === 'active' 
                                                ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                                : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleAddNewRate(ro)} className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">New Rate</button>
                                            <button onClick={() => ro.activeRate && handleEdit(ro, ro.activeRate)} disabled={!ro.activeRate} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
                                            <button onClick={() => ro.activeRate && handleDelete(ro.id, ro.activeRate.id)} disabled={!ro.activeRate} className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
                                            <button onClick={() => setActivePopover(activePopover === ro.id ? null : ro.id)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Old Rates</button>
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
                    <h4 className="font-bold mb-2">Rate History for {popoverData.ownerName}</h4>
                     <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead><tr>{['From', 'Material', 'Rate/m³', 'Total Rate', 'Start', 'End', 'Status'].map(h=><th key={h} className="text-left pb-1 border-b dark:border-gray-600">{h}</th>)}</tr></thead>
                            <tbody>
                                {popoverData.rates.filter(r=>r.active !== 'active').map(r => (
                                    <tr key={r.id}>
                                        <td>{r.fromSite}</td>
                                        <td>{r.materialType}</td>
                                        <td>{formatCurrency(r.ratePerM3)}</td>
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
    fromSite: '', materialType: '', ratePerM3: 0, gst: '', gstPercentage: 0, gstAmount: 0, totalRate: 0,
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

const RoyaltyForm: React.FC<{ royaltyOwner: RoyaltyOwnerType, initialData?: Partial<RateEntry>, onSave: (royaltyId: string, data: Partial<RateEntry>) => void, onClose: () => void }> = ({ royaltyOwner, initialData, onSave, onClose }) => {
    const { quarries, materials } = useData();
    const [formData, setFormData] = useState({ ...emptyRate, ...initialData });

    const uniqueSites = useMemo(() => Array.from(new Set(quarries.map(q => q.quarryName))), [quarries]);
    const uniqueMaterials = useMemo(() => Array.from(new Set(materials.map(m => m.name))), [materials]);

    useEffect(() => {
        const baseRate = formData.ratePerM3 || 0;
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
    }, [formData.ratePerM3, formData.gst, formData.gstPercentage]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const val = type === 'checkbox' ? (checked ? 'active' : 'not active') : (type === 'number' && name !== 'gstPercentage') ? parseFloat(value) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(royaltyOwner.id, formData);
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
                <InputField label="Rate per m³" id="ratePerM3" name="ratePerM3" type="number" value={formData.ratePerM3} onChange={handleChange} required />
                
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
                    <input type="checkbox" name="active" id="active-royalty-rate" checked={formData.active === 'active'} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor="active-royalty-rate">Set as Active Rate</label>
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

export default RoyaltyPage;
