import React, { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import { User } from '../types';
import { api } from '../services/mockApi';
import { useUI } from '../contexts/UIContext';
import { useData } from '../contexts/DataContext';
import UserForm from '../components/UserForm';

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const { openModal, closeModal } = useUI();
    const { refreshData, refreshKey } = useData();

    useEffect(() => {
        api.getUsers().then(setUsers);
    }, [refreshKey]);

    const handleEditUser = (user: User) => {
        openModal(`Edit User: ${user.name}`, <UserForm user={user} onSave={handleSave} onClose={closeModal} />);
    };

    const handleSave = async (userId: number, userData: Partial<User>) => {
        await api.updateUser(userId, userData);
        refreshData();
        closeModal();
    };

    const headers = ['Name', 'Role', 'Actions'];
    
    const getRoleBadge = (role: string) => {
        const roleColors: { [key: string]: string } = {
            'Admin': 'bg-red-100 text-red-800',
            'Manager': 'bg-blue-100 text-blue-800',
            'Driver': 'bg-green-100 text-green-800',
            'Supervisor': 'bg-yellow-100 text-yellow-800',
        };
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>{role}</span>;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">User Management</h1>
            </div>
            
            <DataTable
                title="System Users"
                headers={headers}
                data={users}
                renderRow={(user: User) => (
                    <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                    <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{getRoleBadge(user.role)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleEditUser(user)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark">
                                Edit
                            </button>
                        </td>
                    </tr>
                )}
            />
        </div>
    );
};

export default Users;