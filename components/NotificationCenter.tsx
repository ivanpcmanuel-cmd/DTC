import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Notification } from '../types';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    setNotifications(StorageService.getNotifications());
  };

  useEffect(() => {
    loadNotifications();
    // Subscribe to storage updates
    window.addEventListener('dtc_notifications_updated', loadNotifications);
    
    // Click outside to close
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('dtc_notifications_updated', loadNotifications);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.markAsRead(id);
  };

  const handleMarkAllRead = () => {
    StorageService.markAllAsRead();
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'error': return 'text-red-500 bg-red-50 border-red-200';
      case 'success': return 'text-green-500 bg-green-50 border-green-200';
      default: return 'text-blue-500 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-dtc-blue transition-colors rounded-full hover:bg-gray-100 focus:outline-none"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-800">Notificações</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-dtc-blue hover:text-blue-700 font-medium flex items-center"
              >
                <Check size={14} className="mr-1" /> Marcar lidas
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Nenhuma notificação recente.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <li 
                    key={notif.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors relative group ${notif.read ? 'opacity-60 bg-white' : 'bg-blue-50/30'}`}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${notif.read ? 'bg-transparent' : 'bg-dtc-red'}`} />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                           <p className={`text-sm font-medium ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                             {notif.title}
                           </p>
                           <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                             {new Date(notif.date).toLocaleDateString()}
                           </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                        <div className="flex justify-between items-center mt-2">
                             <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${getIconColor(notif.type)}`}>
                                {notif.category}
                             </span>
                             {!notif.read && (
                                <button 
                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                    className="text-xs text-dtc-blue hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Marcar lida
                                </button>
                             )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};