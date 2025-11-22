import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { useData } from '../contexts/DataContext';
import { Trip } from '../types';

interface AddTripFormProps {
    onClose: () => void;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label: string;
  error?: string;
  children?: React.ReactNode;
}

const InputField: React.FC<InputProps> = ({ label, error, type, children, ...props }) => {
    const baseClasses = "mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm";
    const errorClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";
    const finalClasses = `${baseClasses} ${error ? errorClasses : ''} ${type === 'date' ? 'pr-8' : ''}`;

    const renderInput = () => {
        if (type === 'select') {
            return <select {...props} className={finalClasses}>{children}</select>
        }
        return <input type={type} {...props} className={finalClasses} />
    }

    return (
        <div className="col-span-1">
            <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <div className="relative">
                {renderInput()}
                {type === 'date' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ion-icon name="calendar-outline" className="text-gray-400"></ion-icon>
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  fileName?: string;
}

const FileInputField: React.FC<FileInputProps> = ({ label, id, fileName, ...props }) => (
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

const initialFormData = {
    date: '',
    place: '',
    customer: '',
    invoiceDCNumber: '',
    quarryName: '',
    royaltyOwnerName: '',
    material: '',
    vehicleNumber: '',
    transporterName: '',
    netWeight: '0',
    royaltyNumber: '',
    royaltyM3: '',
    deductionPercentage: '0',
    sizeChangePercentage: '0',
    agent: '',
};

const AddTripForm: React.FC<AddTripFormProps> = ({ onClose }) => {
    const formRef = useRef<HTMLFormElement>(null);
    const { addTrip, vehicles, quarries, customers, materials, royaltyOwners } = useData();

    const [formData, setFormData] = useState(initialFormData);
    const [files, setFiles] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const uniqueCustomers = Array.from(new Set(customers.map(c => c.name)));

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        const requiredFields: (keyof typeof initialFormData)[] = ['date', 'customer', 'quarryName', 'material', 'vehicleNumber', 'netWeight'];
        
        requiredFields.forEach(field => {
            if (!formData[field] || (field === 'netWeight' && parseFloat(formData[field]) <= 0)) {
                 if(formData[field] === '0' || formData[field] === '')
                    newErrors[field] = 'This field is required and must be positive.';
            }
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            console.log('Validation failed');
            return;
        }

        setIsSubmitting(true);
        const netWeight = parseFloat(formData.netWeight) || 0;
        
        const selectedVehicle = vehicles.find(v => v.vehicleNumber === formData.vehicleNumber);
        
        const newTripData: Omit<Trip, 'id' | 'paymentStatus' | 'revenue' | 'materialCost' | 'transportCost' | 'royaltyCost' | 'profit' | 'status' | 'createdBy'> = {
            date: formData.date,
            place: formData.place,
            vendorName: formData.quarryName, 
            customer: formData.customer,
            invoiceDCNumber: formData.invoiceDCNumber,
            quarryName: formData.quarryName,
            royaltyOwnerName: formData.royaltyOwnerName,
            material: formData.material,
            vehicleNumber: formData.vehicleNumber,
            transporterName: selectedVehicle?.ownerName || formData.transporterName,
            emptyWeight: 0, 
            grossWeight: netWeight, 
            netWeight: netWeight,
            royaltyNumber: formData.royaltyNumber,
            royaltyTons: netWeight, 
            royaltyM3: parseFloat(formData.royaltyM3) || 0,
            deductionPercentage: parseFloat(formData.deductionPercentage) || 0,
            sizeChangePercentage: parseFloat(formData.sizeChangePercentage) || 0,
            tonnage: netWeight,
            agent: formData.agent,
        };

        try {
            await addTrip(newTripData);
            onClose();
        } catch (error) {
            console.error("Failed to add trip", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles({ ...files, [e.target.id]: e.target.files[0].name });
        }
    };
    
    const handleReset = () => {
        setFormData(initialFormData);
        setFiles({});
        setErrors({});
        formRef.current?.reset();
    };

    return (
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="p-8">
            <div className="space-y-10">
                <div>
                    <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">1. Enter Details</h3>
                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                        <InputField label="Date" id="date" type="date" required error={errors.date} value={formData.date} onChange={handleInputChange}/>
                        <InputField label="Place" id="place" type="text" placeholder="e.g., Construction Site A" value={formData.place} onChange={handleInputChange} />
                        <InputField label="Customer Name" id="customer" type="select" required error={errors.customer} value={formData.customer} onChange={handleInputChange}>
                            <option value="">Select Customer</option>
                            {uniqueCustomers.map(c => <option key={c} value={c}>{c}</option>)}
                        </InputField>
                        <InputField label="DC Number" id="invoiceDCNumber" type="text" placeholder="e.g., DC-12345" value={formData.invoiceDCNumber} onChange={handleInputChange}/>
                        <InputField label="Quarry Name" id="quarryName" type="select" required error={errors.quarryName} value={formData.quarryName} onChange={handleInputChange}>
                             <option value="">Select Quarry</option>
                             {quarries.map(q => <option key={q.id} value={q.quarryName}>{q.quarryName} ({q.ownerName})</option>)}
                        </InputField>
                        <InputField label="Royalty Owner Name" id="royaltyOwnerName" type="select" value={formData.royaltyOwnerName} onChange={handleInputChange}>
                             <option value="">Select Royalty Owner</option>
                             {royaltyOwners.map(r => <option key={r.id} value={r.ownerName}>{r.ownerName}</option>)}
                        </InputField>
                        <InputField label="Material Type" id="material" type="select" required error={errors.material} value={formData.material} onChange={handleInputChange}>
                             <option value="">Select Material</option>
                             {materials.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </InputField>
                        <InputField label="Vehicle Number" id="vehicleNumber" type="select" required error={errors.vehicleNumber} value={formData.vehicleNumber} onChange={handleInputChange}>
                            <option value="">Select Vehicle</option>
                            {vehicles.map(v => <option key={v.id} value={v.vehicleNumber}>{v.vehicleNumber} ({v.ownerName})</option>)}
                        </InputField>
                        <InputField label="Agent" id="agent" type="text" placeholder="e.g., Agent Name" value={formData.agent} onChange={handleInputChange} />
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">Wayment Slip</h3>
                     <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
                        <InputField label="Net Weight (Tons)" id="netWeight" type="number" step="0.01" value={formData.netWeight} onChange={handleInputChange} error={errors.netWeight} required />
                        <InputField label="Deduction %" id="deductionPercentage" type="number" step="0.01" value={formData.deductionPercentage} onChange={handleInputChange} />
                        <InputField label="Royalty Number" id="royaltyNumber" type="text" placeholder="e.g., R-9876" value={formData.royaltyNumber} onChange={handleInputChange}/>
                        <InputField label="Royalty M3" id="royaltyM3" type="number" step="0.01" placeholder="e.g., 14" value={formData.royaltyM3} onChange={handleInputChange}/>
                        <InputField label="Size Change %" id="sizeChangePercentage" type="number" step="0.01" value={formData.sizeChangePercentage} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="pt-4">
                     <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">2. Upload Documents</h3>
                     <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                        <FileInputField label="DC Upload" id="dcUpload" onChange={handleFileChange} fileName={files.dcUpload} />
                        <FileInputField label="Wayment Slip Upload" id="waymentUpload" onChange={handleFileChange} fileName={files.waymentUpload}/>
                        <FileInputField label="Royalty Upload" id="royaltyUpload" onChange={handleFileChange} fileName={files.royaltyUpload}/>
                        <FileInputField label="Tax Invoice" id="taxInvoiceUpload" onChange={handleFileChange} fileName={files.taxInvoiceUpload}/>
                        <FileInputField label="Eway Bill" id="ewayBillUpload" onChange={handleFileChange} fileName={files.ewayBillUpload}/>
                     </div>
                </div>
            </div>

            <div className="pt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Cancel
                </button>
                 <button type="button" onClick={handleReset} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Reset
                </button>
                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Save Trip'}
                </button>
            </div>
        </form>
    );
};

export default AddTripForm;