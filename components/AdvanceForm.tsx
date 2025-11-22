import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Trip, Advance, Account } from '../types';
import { api } from '../services/mockApi';

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> & { label: string, isReadOnly?: boolean, children?: React.ReactNode }> = ({ label, isReadOnly, ...props }) => (
    <div className="col-span-1">
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {isReadOnly ? (
            <div className="mt-1 block w-full px-3 py-2 text-gray-500 dark:text-gray-400 min-h-[42px] flex items-center bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">{props.value || '-'}</div>
        ) : props.type === 'select' ? (
             <select {...props as React.SelectHTMLAttributes<HTMLSelectElement>} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">{props.children}</select>
        ) : (
             <input {...props as React.InputHTMLAttributes<HTMLInputElement>} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
        )}
    </div>
);

const FileInputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; fileName?: string; }> = ({ label, id, fileName, ...props }) => (
     <div className="col-span-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="mt-1 flex items-center">
            <label htmlFor={id} className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                <span>Choose File</span>
                <input {...props} id={id} name={id} type="file" className="sr-only" />
            </label>
            <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 truncate">{fileName || "No file chosen"}</span>
        </div>
    </div>
);

interface AdvanceFormProps {
    advance?: Advance;
    onClose: () => void;
}

const AdvanceForm: React.FC<AdvanceFormProps> = ({ advance, onClose }) => {
    const { trips, accounts } = useData();
    const [entryType, setEntryType] = useState<'trip' | 'manual'>(advance?.tripId ? 'trip' : 'manual');
    const [selectedTripId, setSelectedTripId] = useState<string>(advance?.tripId?.toString() || '');
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [formData, setFormData] = useState({
        date: advance?.date || new Date().toISOString().split('T')[0],
        purpose: advance?.purpose || '',
        amount: advance?.amount || 0,
        fromAccount: advance?.fromAccount || '',
        toAccount: advance?.toAccount || '',
    });
    const [fileName, setFileName] = useState<string | undefined>(advance?.voucherSlipUpload);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const trip = trips.find(t => t.id === Number(selectedTripId));
        setSelectedTrip(trip || null);
        if (trip) {
            setFormData(f => ({...f, toAccount: `${trip.vendorName} / ${trip.transporterName}`}));
        }
    }, [selectedTripId, trips]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        setFormData(p => ({ ...p, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const isTripLinked = entryType === 'trip' && selectedTrip;
            const payload: Omit<Advance, 'id'> = {
                date: formData.date,
                fromAccount: formData.fromAccount,
                toAccount: isTripLinked ? `${selectedTrip.vendorName} / ${selectedTrip.transporterName}` : formData.toAccount,
                purpose: formData.purpose,
                amount: formData.amount,
                voucherSlipUpload: fileName,
                ...(isTripLinked && {
                    tripId: selectedTrip.id,
                    place: selectedTrip.place,
                    invoiceDCNumber: selectedTrip.invoiceDCNumber,
                    vehicleNumber: selectedTrip.vehicleNumber,
                    ownerAndTransporterName: `${selectedTrip.vendorName} / ${selectedTrip.transporterName}`,
                })
            };
            if (advance) {
                await api.updateAdvance(advance.id, payload);
            } else {
                await api.addAdvance(payload);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save advance", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">Advance Details</h3>
                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                        <InputField label="Date" id="date" type="date" value={formData.date} onChange={handleInputChange} required />
                        <InputField label="Purpose" id="purpose" type="text" value={formData.purpose} onChange={handleInputChange} required />
                        <InputField label="Amount" id="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} required />
                        
                        <InputField label="Payment From" id="fromAccount" type="select" value={formData.fromAccount} onChange={handleInputChange} required>
                            <option value="">Select source account...</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                        </InputField>
                        
                        <div className="sm:col-span-2 flex items-center space-x-4 pt-6">
                            <label><input type="radio" value="manual" checked={entryType === 'manual'} onChange={() => setEntryType('manual')} className="mr-2"/> Manual Entry</label>
                            <label><input type="radio" value="trip" checked={entryType === 'trip'} onChange={() => setEntryType('trip')} className="mr-2"/> Link to Trip</label>
                        </div>
                        
                        {entryType === 'manual' && (
                             <InputField label="Payment To" id="toAccount" type="text" value={formData.toAccount} onChange={handleInputChange} required />
                        )}

                        {entryType === 'trip' && (
                             <div className="lg:col-span-2">
                                <InputField label="Select Trip by Date & Vehicle" id="tripId" type="select" value={selectedTripId} onChange={e => setSelectedTripId(e.target.value)} required>
                                    <option value="">Select a trip...</option>
                                    {trips.map(trip => (
                                        <option key={trip.id} value={trip.id}>
                                            {trip.date} - {trip.vehicleNumber} ({trip.customer})
                                        </option>
                                    ))}
                                </InputField>
                            </div>
                        )}

                         <div className="lg:col-span-3">
                             <FileInputField label="Voucher Slip Upload" id="voucherSlipUpload" onChange={handleFileChange} fileName={fileName} />
                         </div>
                    </div>
                </div>
            </div>
             <div className="pt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Save Advance'}
                </button>
            </div>
        </form>
    );
};
export default AdvanceForm;