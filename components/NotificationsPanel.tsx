import React, { useState, useEffect } from 'react';
import { Notification } from '../types';
import { api } from '../services/mockApi';

const NotificationsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    api.getNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'alert': return { icon: 'warning', color: 'text-red-500' };
      case 'info': return { icon: 'information-circle', color: 'text-blue-500' };
      case 'success': return { icon: 'checkmark-circle', color: 'text-green-500' };
      default: return { icon: 'notifications', color: 'text-gray-500' };
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative text-gray-500 dark:text-gray-300 focus:outline-none">
        <ion-icon name="notifications-outline" className="text-2xl"></ion-icon>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div 
            onMouseLeave={() => setIsOpen(false)}
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-700 rounded-md shadow-lg z-20">
          <div className="p-4 font-bold border-b dark:border-gray-600">Notifications</div>
          <ul>
            {notifications.map(notification => (
              <li 
                key={notification.id} 
                className={`flex p-4 border-b dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onClick={() => handleMarkAsRead(notification.id)}>
                <ion-icon name={getIcon(notification.type).icon} className={`text-2xl mr-3 ${getIcon(notification.type).color}`}></ion-icon>
                <div className="text-sm">
                  <p className="text-gray-700 dark:text-gray-200">{notification.message}</p>
                  <p className="text-xs text-gray-400">{new Date(notification.timestamp).toLocaleString()}</p>
                </div>
              </li>
            ))}
             {notifications.length === 0 && (
                <li className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No new notifications.</li>
             )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;