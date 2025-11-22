import React, { useState, useEffect, useMemo, useRef } from 'react';
import { VehicleOwner as TransportType, RateEntry } from '../types';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import PageHeader from '../components/PageHeader';
import { Filters } from '../components/FilterPanel';
import AddVehicleForm from '../components/AddVehicleForm';
import { formatCurrency, safeToFixed } from '../utils';

// Helper to find the active rate
const getActiveRate = (rates: RateEntry[]): RateEntry | undefined => rates.find(r => r.active === 'active');

const TransportPage: React.FC = () => {
    const { vehicles, addTransportRate, updateTransportRate, deleteTransportRate, quarries, materials } = useData();
    const { openModal, closeModal } = useUI();
    const [filters, setFilters] = useState<Filters>({});
    const [activePopover, setActivePopover] = useState<string | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const flatData = useMemo(() => vehicles.map(t => ({
        ...t,
        activeRate: getActiveRate(t.rates)
    })), [vehicles]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setActivePopover(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSave = async (transportId: string, data: Partial<RateEntry>) => {
        if ('id' in data) {
            await updateTransportRate(transportId, data as RateEntry);
        } else {
            await addTransportRate(transportId, data as Omit<RateEntry, 'id'>);
        }
        closeModal();
    };

    const handleEdit = (transport: TransportType, rate: RateEntry) => {
        openModal(`Edit Rate for ${transport.vehicleNumber}`, <TransportForm transport={transport} initialData={rate} onSave={handleSave} onClose={closeModal} />);
    };
    
    const handleAddNewRate = (transport: TransportType) => {
         openModal(`Add New Rate for ${transport.vehicleNumber}`, <TransportForm transport={transport} onSave={handleSave} onClose={closeModal} />);
    }

    const handleAddTransport = () => {
        openModal('Add New Transport', <AddVehicleForm onClose={closeModal} />);
    }

    const handleDelete = async (transportId: string, rateId: string) => {
        if (window.confirm('Are you sure you want to delete this rate? This cannot be undone.')) {
            await deleteTransportRate(transportId, rateId);
        }
    };
    
    const popoverData = useMemo(() => {
        if (!activePopover) return null;
        return vehicles.find(t => t.id === activePopover);
    }, [activePopover, vehicles]);

    return (
        <div className="relative">
            <PageHeader
                title="Transport Management"
                filters={filters}
                onFilterChange={setFilters}
                filterData={{ vehicles: [], customers: [], quarries: [], royaltyOwners: [] }}
                pageAction={{ label: 'Add Transport', action: handleAddTransport }}
            />
            
            <main className="pt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Transport Rates List</h2>
                         <p className="text-sm text-gray-500">Showing current active rate for each vehicle</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {['Owner', 'Vehicle No.', 'From Site', 'Material', 'Total Rate', 'Effective From', 'To', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {flatData.map(t => (
                                    <tr key={t.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{t.ownerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t.vehicleNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t.activeRate?.fromSite || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t.activeRate?.materialType || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{formatCurrency(t.activeRate?.totalRate)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t.activeRate?.effectiveFrom || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t.activeRate?.effectiveTo || 'Present'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {t.activeRate?.active === 'active' 
                                                ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                                : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleAddNewRate(t)} className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">New Rate</button>
                                            <button onClick={() => t.activeRate && handleEdit(t, t.activeRate)} disabled={!t.activeRate} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
                                            <button onClick={() => t.activeRate && handleDelete(t.id, t.activeRate.id)} disabled={!t.activeRate} className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
                                            <button onClick={() => setActivePopover(activePopover === t.id ? null : t.id)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Old Rates</button>
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
                    <h4 className="font-bold mb-2">Rate History for {popoverData.vehicleNumber}</h4>
                    <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead><tr>{['From', 'Material', 'Rate/Km', 'Rate/Ton', 'Total Rate', 'Start', 'End', 'Status'].map(h=><th key={h} className="text-left pb-1 border-b dark:border-gray-600">{h}</th>)}</tr></thead>
                            <tbody>
                                {popoverData.rates.filter(r=>r.active !== 'active').map(r => (
                                    <tr key={r.id}><td>{r.fromSite}</td><td>{r.materialType}</td><td>{formatCurrency(r.ratePerKm)}</td><td>{formatCurrency(r.ratePerTon)}</td><td>{formatCurrency(r.totalRate)}</td><td>{r.effectiveFrom}</td><td>{r.effectiveTo}</td><td>Inactive</td></tr>
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
    fromSite: '', materialType: '', ratePerKm: 0, ratePerTon: 0, gst: '', gstPercentage: 0, gstAmount: 0, totalRate: 0,
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


const TransportForm: React.FC<{ transport: TransportType, initialData?: Partial<RateEntry>, onSave: (transportId: string, data: Partial<RateEntry>) => void, onClose: () => void }> = ({ transport, initialData, onSave, onClose }) => {
    const { quarries, materials } = useData();
    const [formData, setFormData] = useState({ ...emptyRate, ...initialData });

    const uniqueSites = useMemo(() => Array.from(new Set(quarries.map(q => q.quarryName))), [quarries]);
    const uniqueMaterials = useMemo(() => Array.from(new Set(materials.map(m => m.name))), [materials]);

    useEffect(() => {
        const ratePerTon = formData.ratePerTon || 0;
        const ratePerKm = formData.ratePerKm || 0;
        const gstPercent = formData.gstPercentage || 0;
        
        const baseRate = ratePerTon + ratePerKm;
        let total = baseRate;
        let gstAmt = 0;

        if (gstPercent > 0) {
            gstAmt = baseRate * (gstPercent / 100);
            if (formData.gst === 'exclusive') {
                total = baseRate + gstAmt;
            }
        }
        setFormData(p => ({ ...p, gstAmount: gstAmt, totalRate: total }));

    }, [formData.ratePerTon, formData.ratePerKm, formData.gst, formData.gstPercentage]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const val = type === 'checkbox' ? (checked ? 'active' : 'not active') : (type === 'number' && name !== 'gstPercentage') ? parseFloat(value) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(transport.id, formData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <InputField label="From Site" id="fromSite" name="fromSite" type="select" value={formData.fromSite} onChange={handleChange} required>
                    <option value="">Select Site</option>
                    {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
                </InputField>
                <InputField label="Material Type" id="materialType" name="materialType" type="select" value={formData.materialType} onChange={handleChange} required>
                    <option value="">Select Material</option>
                    {uniqueMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                </InputField>
                <InputField label="Rate per Km" id="ratePerKm" name="ratePerKm" type="number" value={formData.ratePerKm} onChange={handleChange} required />
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

                <div className="col-span-full">
                    <InputField label="Remarks" id="remarks" name="remarks" type="textarea" value={formData.remarks} onChange={handleChange} />
                </div>

                <div className="col-span-full flex items-center space-x-2">
                    <input type="checkbox" name="active" id="active-rate" checked={formData.active === 'active'} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor="active-rate">Set as Active Rate</label>
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

export default TransportPage;
