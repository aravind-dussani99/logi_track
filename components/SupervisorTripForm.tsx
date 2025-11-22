import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Trip, Trip as TripType } from '../types';
import { safeToFixed } from '../utils';

interface SupervisorTripFormProps {
    mode: 'enter' | 'upload' | 'edit' | 'view';
    trip?: TripType;
    onClose: () => void;
}

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

const FileInputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; fileName?: string; isReadOnly?: boolean; }> = ({ label, id, fileName, isReadOnly, ...props }) => (
     <div className="col-span-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {isReadOnly ? (
             <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 truncate">{fileName || "Not uploaded"}</p>
        ) : (
            <div className="mt-1 flex items-center">
                <label htmlFor={id} className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <span>Choose File</span>
                    <input {...props} id={id} name={id} type="file" className="sr-only" />
                </label>
                <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 truncate">{fileName || "No file chosen"}</span>
            </div>
        )}
    </div>
);

const SupervisorTripForm: React.FC<SupervisorTripFormProps> = ({ mode, trip, onClose }) => {
    const { addTrip, updateTrip, vehicles, quarries, customers, materials, royaltyOwners } = useData();
    const [formData, setFormData] = useState<Partial<TripType>>({
        date: new Date().toISOString().split('T')[0],
        emptyWeight: 0,
        grossWeight: 0,
        netWeight: 0,
        royaltyTons: 0,
        royaltyM3: 0,
    });
    const [files, setFiles] = useState<{ [key: string]: string | undefined }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (trip) {
            setFormData(trip);
            setFiles({
                ewayBillUpload: trip.ewayBillUpload,
                invoiceDCUpload: trip.invoiceDCUpload,
                waymentSlipUpload: trip.waymentSlipUpload,
                royaltyUpload: trip.royaltyUpload,
                taxInvoiceUpload: trip.taxInvoiceUpload
            });
        }
    }, [trip]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        let newFormData = { ...formData, [id]: type === 'number' ? parseFloat(value) || 0 : value };

        if (id === 'grossWeight' || id === 'emptyWeight') {
            const gross = id === 'grossWeight' ? parseFloat(value) : newFormData.grossWeight;
            const empty = id === 'emptyWeight' ? parseFloat(value) : newFormData.emptyWeight;
            newFormData.netWeight = Math.max(0, (gross || 0) - (empty || 0));
        }
        
        if (id === 'vehicleNumber') {
            const vehicle = vehicles.find(v => v.vehicleNumber === value);
            newFormData.transporterName = vehicle?.ownerName || '';
        }
        
        if (id === 'quarryName') {
            const quarry = quarries.find(q => q.quarryName === value);
            newFormData.vendorName = quarry?.ownerName || '';
        }

        setFormData(newFormData);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles({ ...files, [e.target.id]: e.target.files[0].name });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (mode === 'enter') {
                await addTrip(formData as Omit<Trip, 'id' | 'paymentStatus' | 'revenue' | 'materialCost' | 'transportCost' | 'royaltyCost' | 'profit' | 'status' | 'createdBy'>);
            } else if (mode === 'upload' || mode === 'edit') {
                const uploadData = {
                    ewayBillUpload: files.ewayBillUpload,
                    invoiceDCUpload: files.invoiceDCUpload,
                    waymentSlipUpload: files.waymentSlipUpload,
                    royaltyUpload: files.royaltyUpload,
                    taxInvoiceUpload: files.taxInvoiceUpload
                }
                await updateTrip(trip!.id, { ...formData, ...uploadData });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save trip", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isReadOnly = mode === 'view';

    return (
        <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
                { /* ENTER MODE: Expanded form */ }
                {mode === 'enter' && (
                     <div>
                        <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">Enter New Trip</h3>
                        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
                             <InputField label="Date" id="date" type="date" value={formData.date} onChange={handleInputChange} required />
                             <InputField label="Place" id="place" type="text" placeholder="e.g. Project Site A" value={formData.place} onChange={handleInputChange} required />
                             <InputField label="Invoice & DC Number" id="invoiceDCNumber" type="text" value={formData.invoiceDCNumber} onChange={handleInputChange} />
                             <InputField label="Customer Name" id="customer" type="select" value={formData.customer} onChange={handleInputChange} required>
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </InputField>
                             <InputField label="Quarry Name" id="quarryName" type="select" value={formData.quarryName} onChange={handleInputChange} required>
                                <option value="">Select Quarry</option>
                                {quarries.map(q => <option key={q.id} value={q.quarryName}>{q.quarryName}</option>)}
                            </InputField>
                            <InputField label="Material Type" id="material" type="select" value={formData.material} onChange={handleInputChange} required>
                                <option value="">Select Material</option>
                                {materials.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                            </InputField>
                             <InputField label="Royalty Owner Name" id="royaltyOwnerName" type="select" value={formData.royaltyOwnerName} onChange={handleInputChange}>
                                 <option value="">Select Royalty Owner</option>
                                 {royaltyOwners.map(r => <option key={r.id} value={r.ownerName}>{r.ownerName}</option>)}
                            </InputField>
                            <InputField label="Royalty Number" id="royaltyNumber" type="text" value={formData.royaltyNumber} onChange={handleInputChange} />
                            <InputField label="Royalty Tons" id="royaltyTons" type="number" step="0.01" value={formData.royaltyTons} onChange={handleInputChange} />
                            <InputField label="Royalty M3" id="royaltyM3" type="number" step="0.01" value={formData.royaltyM3} onChange={handleInputChange} />

                            <InputField label="Vehicle Number" id="vehicleNumber" type="select" value={formData.vehicleNumber} onChange={handleInputChange} required>
                                <option value="">Select Vehicle</option>
                                {vehicles.map(v => <option key={v.id} value={v.vehicleNumber}>{v.vehicleNumber}</option>)}
                            </InputField>
                            <InputField label="Transporter Name" id="transporterName" type="text" value={formData.transporterName} onChange={handleInputChange} required />
                            <InputField label="Transporter/Driver Mobile" id="transportOwnerMobileNumber" type="text" value={formData.transportOwnerMobileNumber} onChange={handleInputChange} />
                            
                            <InputField label="Empty Weight (Tons)" id="emptyWeight" type="number" step="0.01" value={formData.emptyWeight} onChange={handleInputChange} />
                            <InputField label="Gross Weight (Tons)" id="grossWeight" type="number" step="0.01" value={formData.grossWeight} onChange={handleInputChange} />
                            <InputField label="Net Weight (Tons)" id="netWeight" type="number" step="0.01" value={safeToFixed(formData.netWeight)} isReadOnly={true} />
                        </div>
                    </div>
                )}
                
                { /* UPLOAD MODE: Read-only summary + upload fields */ }
                {mode === 'upload' && (
                    <>
                        <div>
                             <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">Upload Documents for Trip #{trip?.id}</h3>
                             <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg grid grid-cols-3 gap-4 text-sm">
                                <div><strong>Date:</strong> {trip?.date}</div>
                                <div><strong>Vehicle:</strong> {trip?.vehicleNumber}</div>
                                <div><strong>Customer:</strong> {trip?.customer}</div>
                             </div>
                        </div>
                        <div>
                            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                                <FileInputField label="E-Way Bill" id="ewayBillUpload" onChange={handleFileChange} fileName={files.ewayBillUpload} />
                                <FileInputField label="Invoice / DC" id="invoiceDCUpload" onChange={handleFileChange} fileName={files.invoiceDCUpload} />
                                <FileInputField label="Wayment Slip" id="waymentSlipUpload" onChange={handleFileChange} fileName={files.waymentSlipUpload} />
                                <FileInputField label="Royalty Slip" id="royaltyUpload" onChange={handleFileChange} fileName={files.royaltyUpload} />
                                <FileInputField label="Tax Invoice" id="taxInvoiceUpload" onChange={handleFileChange} fileName={files.taxInvoiceUpload} />
                            </div>
                        </div>
                    </>
                )}

                { /* EDIT or VIEW MODE: All fields, no subsections */ }
                {(mode === 'edit' || mode === 'view') && (
                     <div>
                        <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">{mode === 'edit' ? 'Edit' : 'View'} Trip #{trip?.id}</h3>
                        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
                             <InputField label="Date" id="date" type="date" value={formData.date} onChange={handleInputChange} isReadOnly={isReadOnly} required />
                             <InputField label="Place" id="place" type="text" value={formData.place} onChange={handleInputChange} isReadOnly={isReadOnly} required />
                             <InputField label="Invoice & DC Number" id="invoiceDCNumber" type="text" value={formData.invoiceDCNumber} onChange={handleInputChange} isReadOnly={isReadOnly} />
                            <InputField label="Customer Name" id="customer" type="select" value={formData.customer} onChange={handleInputChange} isReadOnly={isReadOnly} required>
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </InputField>
                            <InputField label="Quarry Name" id="quarryName" type="select" value={formData.quarryName} onChange={handleInputChange} isReadOnly={isReadOnly} required>
                                <option value="">Select Quarry</option>
                                {quarries.map(q => <option key={q.id} value={q.quarryName}>{q.quarryName}</option>)}
                            </InputField>
                            <InputField label="Material Type" id="material" type="select" value={formData.material} onChange={handleInputChange} isReadOnly={isReadOnly} required>
                                <option value="">Select Material</option>
                                {materials.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                            </InputField>
                            <InputField label="Royalty Owner Name" id="royaltyOwnerName" type="select" value={formData.royaltyOwnerName} onChange={handleInputChange} isReadOnly={isReadOnly}>
                                <option value="">Select Royalty Owner</option>
                                {royaltyOwners.map(r => <option key={r.id} value={r.ownerName}>{r.ownerName}</option>)}
                            </InputField>
                            <InputField label="Royalty Number" id="royaltyNumber" type="text" value={formData.royaltyNumber} onChange={handleInputChange} isReadOnly={isReadOnly} />
                            <InputField label="Royalty Tons" id="royaltyTons" type="number" step="0.01" value={formData.royaltyTons} onChange={handleInputChange} isReadOnly={isReadOnly} />
                            <InputField label="Royalty M3" id="royaltyM3" type="number" step="0.01" value={formData.royaltyM3} onChange={handleInputChange} isReadOnly={isReadOnly} />

                            <InputField label="Vehicle Number" id="vehicleNumber" type="select" value={formData.vehicleNumber} onChange={handleInputChange} isReadOnly={isReadOnly} required>
                                <option value="">Select Vehicle</option>
                                {vehicles.map(v => <option key={v.id} value={v.vehicleNumber}>{v.vehicleNumber}</option>)}
                            </InputField>
                            <InputField label="Transporter Name" id="transporterName" type="text" value={formData.transporterName} onChange={handleInputChange} isReadOnly={isReadOnly} />
                            <InputField label="Transporter/Driver Mobile" id="transportOwnerMobileNumber" type="text" value={formData.transportOwnerMobileNumber} onChange={handleInputChange} isReadOnly={isReadOnly} />

                            <InputField label="Empty Weight (Tons)" id="emptyWeight" type="number" step="0.01" value={formData.emptyWeight} onChange={handleInputChange} isReadOnly={isReadOnly} />
                            <InputField label="Gross Weight (Tons)" id="grossWeight" type="number" step="0.01" value={formData.grossWeight} onChange={handleInputChange} isReadOnly={isReadOnly} />
                            <InputField label="Net Weight (Tons)" id="netWeight" type="number" step="0.01" value={safeToFixed(formData.netWeight)} isReadOnly={true} />
                            
                            <InputField label="Vendor Name (Quarry Owner)" id="vendorName" type="text" value={formData.vendorName} isReadOnly={true} />


                            {/* Upload fields integrated */}
                            <FileInputField label="E-Way Bill" id="ewayBillUpload" onChange={handleFileChange} fileName={files.ewayBillUpload} isReadOnly={isReadOnly} />
                            <FileInputField label="Invoice / DC" id="invoiceDCUpload" onChange={handleFileChange} fileName={files.invoiceDCUpload} isReadOnly={isReadOnly} />
                            <FileInputField label="Wayment Slip" id="waymentSlipUpload" onChange={handleFileChange} fileName={files.waymentSlipUpload} isReadOnly={isReadOnly} />
                            <FileInputField label="Royalty Slip" id="royaltyUpload" onChange={handleFileChange} fileName={files.royaltyUpload} isReadOnly={isReadOnly} />
                            <FileInputField label="Tax Invoice" id="taxInvoiceUpload" onChange={handleFileChange} fileName={files.taxInvoiceUpload} isReadOnly={isReadOnly} />
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    {isReadOnly ? 'Close' : 'Cancel'}
                </button>
                {!isReadOnly && (
                    <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50">
                        {isSubmitting ? 'Saving...' : (mode === 'upload' ? 'Save & Send to Transit' : 'Save')}
                    </button>
                )}
            </div>
        </form>
    );
};

export default SupervisorTripForm;