import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Order {
  id: string;
  userId: string;
  items: any[];
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount?: number;
  shippingAddress?: any;
  customerLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  customerDetails?: {
    uid: string;
    name: string;
    phone: string;
    email?: string;
    address?: any;
  };
  riderId?: string;
  riderInfo?: {
    id?: string;
    name?: string;
    phone?: string;
    vehicleNumber?: string;
    rating?: number;
  };
  riderLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
  };
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled' | 'placed' | 'confirmed' | 'packed' | 'on_the_way';
  paymentMethod: 'cod' | 'online' | 'wallet';
  createdAt: any;
  updatedAt?: any;
}

interface OrderState {
  orders: Order[];
  activeOrders: Order[];
  pastOrders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  activeOrders: [],
  pastOrders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
      // Derived active and past orders (any status not delivered or cancelled is active)
      state.activeOrders = action.payload.filter(o => 
        !['delivered', 'cancelled'].includes(o.status.toLowerCase())
      );
      state.pastOrders = action.payload.filter(o => 
        ['delivered', 'cancelled'].includes(o.status.toLowerCase())
      );
    },
    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload;
    },
    updateOrderStatus: (state, action: PayloadAction<{ id: string; status: Order['status'] }>) => {
      const order = state.orders.find(o => o.id === action.payload.id);
      if (order) {
        order.status = action.payload.status;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  },
});

export const { setOrders, setCurrentOrder, updateOrderStatus, setLoading, setError } = orderSlice.actions;
export default orderSlice.reducer;
