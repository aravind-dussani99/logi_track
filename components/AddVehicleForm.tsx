import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useData } from '../contexts/DataContext';
import { VehicleOwner, RateEntry } from '../types';
import { safeToFixed } from '../utils';

interface AddVehicleFormProps {
    onClose: () => void;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> & {label: string}> = ({ label, ...props }) => (
    <div className="col-span-1">
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {props.type === 'select' ? (
             <select {...props as React.SelectHTMLAttributes<HTMLSelectElement>} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
        ) : props.type === 'textarea' ? (
            <textarea {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>} rows={3} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
        ) : (
             <input {...props as React.InputHTMLAttributes<HTMLInputElement>} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm" />
        )}
    </div>
);


const AddVehicleForm: React.FC<AddVehicleFormProps> = ({ onClose }) => {
    const { addVehicleOwner } = useData();
    const [ownerData, setOwnerData] = useState<Omit<VehicleOwner, 'id' | 'rates'>>({
        ownerName: '', contactNumber: '', address: '', vehicleNumber: '', vehicleType: '', vehicleCapacity: 0, openingBalance: 0
    });
    const [rateData, setRateData] = useState<Omit<RateEntry, 'id'>>({
        fromSite: '', materialType: '', ratePerKm: 0, ratePerTon: 0, gst: '', gstPercentage: 0, gstAmount: 0, totalRate: 0,
        effectiveFrom: '', effectiveTo: '', active: 'active', remarks: ''
    });

    useEffect(() => {
        const ratePerTon = rateData.ratePerTon || 0;
        const ratePerKm = rateData.ratePerKm || 0;
        const gstPercent = rateData.gstPercentage || 0;
        const baseRate = ratePerTon + ratePerKm;
        let total = baseRate;
        let gstAmt = 0;
        if (gstPercent > 0) {
            gstAmt = baseRate * (gstPercent / 100);
            if (rateData.gst === 'exclusive') total = baseRate + gstAmt;
        }
        setRateData(p => ({ ...p, gstAmount: gstAmt, totalRate: total }));
    }, [rateData.ratePerTon, rateData.ratePerKm, rateData.gst, rateData.gstPercentage]);

    const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setOwnerData(prev => ({...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const val = type === 'checkbox' ? (checked ? 'active' : 'not active') : (type === 'number' && name !== 'gstPercentage') ? parseFloat(value) || 0 : value;
        setRateData(prev => ({ ...prev, [name]: val }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newVehicle: Omit<VehicleOwner, 'id'> = {
            ...ownerData,
            rates: [{ ...rateData, id: uuidv4() }]
        };
        await addVehicleOwner(newVehicle);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-10">
                <div>
                    <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">1. Owner & Vehicle Details</h3>
                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                       <InputField label="Owner Name" id="ownerName" name="ownerName" type="text" value={ownerData.ownerName} onChange={handleOwnerChange} required />
                       <InputField label="Contact Number" id="contactNumber" name="contactNumber" type="text" value={ownerData.contactNumber} onChange={handleOwnerChange} required />
                       <InputField label="Vehicle Number" id="vehicleNumber" name="vehicleNumber" type="text" value={ownerData.vehicleNumber} onChange={handleOwnerChange} required />
                       <InputField label="Vehicle Type" id="vehicleType" name="vehicleType" type="text" value={ownerData.vehicleType} onChange={handleOwnerChange} />
                       <InputField label="Vehicle Capacity (T)" id="vehicleCapacity" name="vehicleCapacity" type="number" value={ownerData.vehicleCapacity} onChange={handleOwnerChange} />
                       <InputField label="Opening Balance (₹)" id="openingBalance" name="openingBalance" type="number" value={ownerData.openingBalance} onChange={handleOwnerChange} />
                       <div className="sm:col-span-2 lg:col-span-3">
                            <InputField label="Address" id="address" name="address" type="textarea" value={ownerData.address} onChange={handleOwnerChange} required />
                       </div>
                    </div>
                </div>
                 <div>
                    <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">2. Initial Rate</h3>
                     <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
                        <InputField label="From Site" id="fromSite" name="fromSite" type="text" value={rateData.fromSite} onChange={handleRateChange} required />
                        <InputField label="Material Type" id="materialType" name="materialType" type="text" value={rateData.materialType} onChange={handleRateChange} required />
                        <InputField label="Rate per Km" id="ratePerKm" name="ratePerKm" type="number" value={rateData.ratePerKm} onChange={handleRateChange} required />
                        <InputField label="Rate per Ton" id="ratePerTon" name="ratePerTon" type="number" value={rateData.ratePerTon} onChange={handleRateChange} required />
                        
                        <InputField label="GST" id="gst" name="gst" type="select" value={rateData.gst} onChange={handleRateChange}>
                            <option value="">No GST</option>
                            <option value="inclusive">Inclusive GST</option>
                            <option value="exclusive">Exclusive GST</option>
                        </InputField>
                        <InputField label="GST %" id="gstPercentage" name="gstPercentage" type="number" value={rateData.gstPercentage} onChange={handleRateChange} />
                        <InputField label="GST Amount" id="gstAmount" name="gstAmount" type="number" value={safeToFixed(rateData.gstAmount)} readOnly className="bg-gray-100 dark:bg-gray-700" />
                        <InputField label="Total Rate" id="totalRate" name="totalRate" type="number" value={safeToFixed(rateData.totalRate)} readOnly className="font-bold bg-gray-100 dark:bg-gray-700" />

                        <InputField label="Effective From" id="effectiveFrom" name="effectiveFrom" type="date" value={rateData.effectiveFrom} onChange={handleRateChange} required />
                        <InputField label="Effective To" id="effectiveTo" name="effectiveTo" type="date" value={rateData.effectiveTo} onChange={handleRateChange} />
                        <div className="lg:col-span-2">
                           <InputField label="Remarks" id="remarks" name="remarks" type="textarea" value={rateData.remarks} onChange={handleRateChange} />
                        </div>
                    </div>
                 </div>
            </div>
             <div className="pt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Cancel
                </button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none">
                    Save Transport
                </button>
            </div>
        </form>
    );
};

export default AddVehicleForm;
