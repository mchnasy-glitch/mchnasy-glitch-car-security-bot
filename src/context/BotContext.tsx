import React, { createContext, useContext, useState, useEffect } from 'react';
import { Car, Service, Order, UserRole } from '../types';

interface BotContextType {
  cars: Car[];
  services: Service[];
  orders: Order[];
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  phoneShareSimulationMode: 'own_account' | 'alien_account';
  setPhoneShareSimulationMode: (mode: 'own_account' | 'alien_account') => void;
  addCar: (name: string) => { success: boolean; error?: string; carId?: number };
  updateCarName: (carId: number, newName: string) => { success: boolean; error?: string };
  toggleCarActive: (carId: number) => void;
  addService: (carId: number, name: string) => { success: boolean; error?: string; serviceId?: number };
  updateServiceName: (serviceId: number, newName: string) => { success: boolean; error?: string };
  toggleServiceActive: (serviceId: number) => void;
  saveOrder: (data: {
    userId: number;
    customerName: string;
    customerPhone: string;
    carId: number;
    carName: string;
    servicesSnapshot: string[];
  }) => { orderId: number; trackingCode: string };
  resetDatabase: () => void;
}

const INITIAL_CARS: Car[] = [
  { id: 1, name: 'پژو ۲۰۶/۲۰۷', isActive: true, createdAt: '2026-10-28 10:00' },
  { id: 2, name: 'رانا', isActive: true, createdAt: '2026-10-28 10:00' },
  { id: 3, name: 'دنا', isActive: true, createdAt: '2026-10-28 10:00' },
  { id: 4, name: 'پژو ۴۰۵', isActive: true, createdAt: '2026-10-28 10:00' },
  { id: 5, name: 'پراید', isActive: true, createdAt: '2026-10-28 10:00' }
];

const INITIAL_SERVICES: Service[] = [
  {
    id: 1,
    carId: 5, // پراید
    name: 'تعویض قفلهای فابریک و نصب قفل ضدسرقت تیتان',
    isActive: true,
    createdAt: '2026-10-28 10:05'
  },
  {
    id: 2,
    carId: 5, // پراید
    name: 'نصب قفل ضدسرقت باتری',
    isActive: true,
    createdAt: '2026-10-28 10:05'
  },
  {
    id: 3,
    carId: 5, // پراید
    name: 'حذف شاسی دربها',
    isActive: true,
    createdAt: '2026-10-28 10:05'
  },
  {
    id: 4,
    carId: 1, // پژو ۲۰۶/۲۰۷
    name: 'نصب محافظ باتری و کامپیوتر',
    isActive: true,
    createdAt: '2026-10-28 10:10'
  }
];

const BotContext = createContext<BotContextType | undefined>(undefined);

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cars, setCars] = useState<Car[]>(() => {
    const saved = localStorage.getItem('bot_sim_cars');
    return saved ? JSON.parse(saved) : INITIAL_CARS;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('bot_sim_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('bot_sim_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('customer');
  const [phoneShareSimulationMode, setPhoneShareSimulationMode] = useState<'own_account' | 'alien_account'>('own_account');

  useEffect(() => {
    localStorage.setItem('bot_sim_cars', JSON.stringify(cars));
  }, [cars]);

  useEffect(() => {
    localStorage.setItem('bot_sim_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('bot_sim_orders', JSON.stringify(orders));
  }, [orders]);

  const addCar = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'نام خودرو نمی‌تواند خالی باشد.' };
    if (cars.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: 'این خودرو از قبل در پایگاه داده وجود دارد.' };
    }
    const newId = cars.length > 0 ? Math.max(...cars.map(c => c.id)) + 1 : 1;
    const newCar: Car = {
      id: newId,
      name: trimmed,
      isActive: true,
      createdAt: new Date().toLocaleTimeString('fa-IR')
    };
    setCars(prev => [...prev, newCar]);
    return { success: true, carId: newId };
  };

  const updateCarName = (carId: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return { success: false, error: 'نام خودرو نامعتبر است.' };
    if (cars.some(c => c.id !== carId && c.name.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: 'خودرویی با این نام در پایگاه داده وجود دارد.' };
    }
    setCars(prev => prev.map(c => c.id === carId ? { ...c, name: trimmed } : c));
    return { success: true };
  };

  const toggleCarActive = (carId: number) => {
    setCars(prev => prev.map(c => c.id === carId ? { ...c, isActive: !c.isActive } : c));
  };

  const addService = (carId: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'عنوان خدمت نمی‌تواند خالی باشد.' };
    const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
    const newSrv: Service = {
      id: newId,
      carId,
      name: trimmed,
      isActive: true,
      createdAt: new Date().toLocaleTimeString('fa-IR')
    };
    setServices(prev => [...prev, newSrv]);
    return { success: true, serviceId: newId };
  };

  const updateServiceName = (serviceId: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return { success: false, error: 'عنوان خدمت نامعتبر است.' };
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, name: trimmed } : s));
    return { success: true };
  };

  const toggleServiceActive = (serviceId: number) => {
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, isActive: !s.isActive } : s));
  };

  const saveOrder = (data: {
    userId: number;
    customerName: string;
    customerPhone: string;
    carId: number;
    carName: string;
    servicesSnapshot: string[];
  }) => {
    const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `AT-2610-${randomCode}`;
    const newOrder: Order = {
      id: newId,
      trackingCode,
      userId: data.userId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      carId: data.carId,
      carName: data.carName, // Immutable snapshot
      servicesSnapshot: [...data.servicesSnapshot], // Immutable snapshot
      status: 'ثبت شده',
      createdAt: new Date().toLocaleString('fa-IR')
    };
    setOrders(prev => [newOrder, ...prev]);
    return { orderId: newId, trackingCode };
  };

  const resetDatabase = () => {
    setCars(INITIAL_CARS);
    setServices(INITIAL_SERVICES);
    setOrders([]);
    localStorage.removeItem('bot_sim_cars');
    localStorage.removeItem('bot_sim_services');
    localStorage.removeItem('bot_sim_orders');
  };

  return (
    <BotContext.Provider
      value={{
        cars,
        services,
        orders,
        currentUserRole,
        setCurrentUserRole,
        phoneShareSimulationMode,
        setPhoneShareSimulationMode,
        addCar,
        updateCarName,
        toggleCarActive,
        addService,
        updateServiceName,
        toggleServiceActive,
        saveOrder,
        resetDatabase
      }}
    >
      {children}
    </BotContext.Provider>
  );
};

export const useBot = () => {
  const context = useContext(BotContext);
  if (!context) throw new Error('useBot must be used within a BotProvider');
  return context;
};
