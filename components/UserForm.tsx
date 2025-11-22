import React, { useState } from 'react';
import { User, Role } from '../types';

interface UserFormProps {
    user: User;
    onSave: (userId: number, userData: Partial<User>) => void;
    onClose: () => void;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> & {label: string, children?: React.ReactNode, isReadOnly?: boolean}> = ({ label, isReadOnly, children, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {props.type === 'select' ? (
             <select {...props as React.SelectHTMLAttributes<HTMLSelectElement>} className="mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">{children}</select>
        ) : (
             <input {...props as React.InputHTMLAttributes<HTMLInputElement>} readOnly={isReadOnly} className={`mt-1 block w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700' : ''}`} />
        )}
    </div>
);

const UserForm: React.FC<UserFormProps> = ({ user, onSave, onClose }) => {
    const [role, setRole] = useState<Role>(user.role);
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const updatedData: Partial<User> = { role };
        if (password) {
            updatedData.password = password;
        }
        onSave(user.id, updatedData);
    };

    return (
         <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField label="Username" id="username" name="username" type="text" value={user.name} isReadOnly />
                
                <InputField label="Role" id="role" name="role" type="select" value={role} onChange={e => setRole(e.target.value as Role)} required>
                    {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                </InputField>

                <div className="sm:col-span-2">
                    <InputField 
                        label="New Password (optional)" 
                        id="password" 
                        name="password" 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="Leave blank to keep current password"
                    />
                </div>
            </div>
            <div className="pt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none">
                    {isSubmitting ? 'Saving...' : 'Save User'}
                </button>
            </div>
        </form>
    );
};

export default UserForm;