export interface Car {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface Service {
  id: number;
  carId: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: number;
  trackingCode: string;
  userId: number;
  customerName: string;
  customerPhone: string;
  carId?: number;
  carName: string; // Snapshot
  servicesSnapshot: string[]; // Snapshot
  status: string;
  createdAt: string;
}

export interface InlineButton {
  text: string;
  callbackData: string;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'admin-system';
  text: string;
  time: string;
  replyKeyboard?: {
    buttons: string[];
    isContact?: boolean;
  };
  inlineKeyboard?: InlineButton[][];
  contactCard?: {
    name: string;
    phone: string;
    isOwnAccount: boolean;
  };
}

export type UserRole = 'customer' | 'admin';

export type CustomerStep =
  | 'idle'
  | 'waiting_for_name'
  | 'waiting_for_phone'
  | 'selecting_car'
  | 'selecting_services'
  | 'confirming_order'
  | 'order_submitted';

export type AdminStep =
  | 'idle'
  | 'main'
  | 'cars_list'
  | 'view_car'
  | 'adding_car'
  | 'editing_car'
  | 'services_list'
  | 'view_service'
  | 'adding_service'
  | 'editing_service'
  | 'orders_list';
