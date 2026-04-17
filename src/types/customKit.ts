export interface CustomKitDto {
  id: string;
  kitNumber: string;
  brandId: string;
  brandName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  orderNotes: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  tierLabel: string;
  freeItems: string;
  status: CustomKitStatus;
  statusNotes: string;
  assignedTo: string;
  submittedAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  isActive: boolean;
  items: CustomKitItemDto[];
}

export interface CustomKitItemDto {
  id: string;
  customKitId: string;
  itemType: 'tool' | 'battery' | 'charger';
  itemName: string;
  itemCategory: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  productId: string;
}

export type CustomKitStatus = 'submitted' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export const CUSTOM_KIT_STATUS_LABELS: Record<CustomKitStatus, string> = {
  submitted: 'Submitted',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const CUSTOM_KIT_STATUS_COLORS: Record<CustomKitStatus, string> = {
  submitted: '#3b82f6',
  confirmed: '#8b5cf6',
  processing: '#f59e0b',
  shipped: '#06b6d4',
  completed: '#10b981',
  cancelled: '#ef4444',
};
