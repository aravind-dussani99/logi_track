import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Trip } from '../types';
import { safeToFixed } from '../utils';

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & { label: string, isReadOnly?: boolean }> = ({ label, isReadOnly, ...props }) => (
    <div className="col-span-1">
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {isReadOnly ? (
            <div className="mt-1 block w-full px-3 py-2 text-gray-500 dark:text-gray-400 min-h-[42px] flex items-center bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">{props.value || '-'}</div>
        ) : props.type === 'textarea' ? (
             <textarea {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>} rows={2} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
        ) : (
            <input {...props} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
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


interface ReceiveTripFormProps {
    trip: Trip;
    onClose: () => void;
}

const ReceiveTripForm: React.FC<ReceiveTripFormProps> = ({ trip, onClose }) => {
    const { updateTrip } = useData();
    const [formData, setFormData] = useState({
        receivedDate: new Date().toISOString().split('T')[0],
        endEmptyWeight: 0,
        endGrossWeight: 0,
        endNetWeight: 0,
        weightDifferenceReason: '',
    });
    const [fileName, setFileName] = useState<string | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const net = Math.max(0, (formData.endGrossWeight || 0) - (formData.endEmptyWeight || 0));
        setFormData(p => ({ ...p, endNetWeight: net }));
    }, [formData.endGrossWeight, formData.endEmptyWeight]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            await updateTrip(trip.id, { ...formData, endWaymentSlipUpload: fileName });
            onClose();
        } catch (error) {
            console.error("Failed to receive trip", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const weightDifference = trip.netWeight - formData.endNetWeight;

    return (
        <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">Trip Details (In Transit)</h3>
                    <div className="mt-4 grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
                        <InputField label="Started Date" value={trip.date} isReadOnly />
                        <InputField label="Vehicle Number" value={trip.vehicleNumber} isReadOnly />
                        <InputField label="Invoice/DC Number" value={trip.invoiceDCNumber} isReadOnly />
                        <InputField label="Start Net Weight (T)" value={`${safeToFixed(trip.netWeight)} T`} isReadOnly />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">Receiving Details</h3>
                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
                        <InputField label="Received Date" id="receivedDate" type="date" value={formData.receivedDate} onChange={handleInputChange} required />
                        <InputField label="End Empty Weight (T)" id="endEmptyWeight" type="number" step="0.01" value={formData.endEmptyWeight} onChange={handleInputChange} />
                        <InputField label="End Gross Weight (T)" id="endGrossWeight" type="number" step="0.01" value={formData.endGrossWeight} onChange={handleInputChange} />
                        <InputField label="End Net Weight (T)" id="endNetWeight" type="number" step="0.01" value={safeToFixed(formData.endNetWeight)} isReadOnly />
                         <div className="lg:col-span-4">
                             <FileInputField label="Wayment Slip (End Location)" id="endWaymentSlipUpload" onChange={handleFileChange} fileName={fileName} />
                         </div>
                         <div className="lg:col-span-2">
                             <InputField label="Weight Difference (T)" value={`${safeToFixed(weightDifference)} T`} isReadOnly />
                         </div>
                          <div className="lg:col-span-2">
                            <InputField label="Reason for Difference" id="weightDifferenceReason" type="textarea" value={formData.weightDifferenceReason} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="pt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Confirm & Validate'}
                </button>
            </div>
        </form>
    );
};
export default ReceiveTripForm;