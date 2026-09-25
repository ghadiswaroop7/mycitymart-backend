import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export const syncCart = createAsyncThunk(
  'cart/syncCart',
  async (uid: string, { rejectWithValue }) => {
    try {
      if (!uid) return [];
      const docRef = doc(db, 'carts', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().items as CartItem[];
      }
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  imageUrl?: string;
  image?: string;
  vendor?: string;
  shopId?: string;
  sellerId?: string;
  category?: string;
  selectedVariants?: Record<string, string>;
  selectedVariant?: any;
  variant?: string;
  taxRate?: number;
}

export interface CartState {
  items: CartItem[];
  total: number; // Subtotal (maintained for 100% backward compatibility)
  subtotal: number;
  tax: number;
  deliveryFee: number;
  grandTotal: number;
  count: number;
}

const initialState: CartState = {
  items: [],
  total: 0,
  subtotal: 0,
  tax: 0,
  deliveryFee: 0,
  grandTotal: 0,
  count: 0,
};

export const getCartItemKey = (item: { id: string; productId?: string; selectedVariant?: any; selectedVariants?: Record<string, string>; variant?: string }): string => {
  const baseId = item.productId || item.id;
  const variantParts: string[] = [];

  if (item.variant) {
    variantParts.push(String(item.variant));
  }
  if (item.selectedVariant) {
    variantParts.push(typeof item.selectedVariant === 'object' ? JSON.stringify(item.selectedVariant) : String(item.selectedVariant));
  }
  if (item.selectedVariants && Object.keys(item.selectedVariants).length > 0) {
    const sortedEntries = Object.entries(item.selectedVariants).sort(([a], [b]) => a.localeCompare(b));
    variantParts.push(JSON.stringify(sortedEntries));
  }

  if (variantParts.length > 0) {
    return `${baseId}__${variantParts.join('_')}`;
  }
  return item.id;
};

export const calculateTotals = (items: CartItem[]) => {
  let count = 0;
  let subtotal = 0;
  let tax = 0;

  items.forEach(item => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    count += qty;
    subtotal += price * qty;

    const itemTaxRate = (item as any).taxRate !== undefined ? Number((item as any).taxRate) : 0;
    if (itemTaxRate > 0) {
      tax += Math.round(price * qty * itemTaxRate);
    }
  });

  const deliveryFee = subtotal > 499 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + tax + deliveryFee;

  return { count, subtotal, total: subtotal, tax, deliveryFee, grandTotal };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      const totals = calculateTotals(state.items);
      state.count = totals.count;
      state.subtotal = totals.subtotal;
      state.total = totals.subtotal;
      state.tax = totals.tax;
      state.deliveryFee = totals.deliveryFee;
      state.grandTotal = totals.grandTotal;
    },
    addToCart(state, action: PayloadAction<CartItem>) {
      const itemKey = getCartItemKey(action.payload);
      const incomingQty = action.payload.quantity && action.payload.quantity > 0 ? action.payload.quantity : 1;
      
      const existingItem = state.items.find(item => item.id === itemKey || getCartItemKey(item) === itemKey || item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += incomingQty;
        if (action.payload.selectedVariants) existingItem.selectedVariants = action.payload.selectedVariants;
        if (action.payload.selectedVariant) existingItem.selectedVariant = action.payload.selectedVariant;
      } else {
        state.items.push({ 
          ...action.payload, 
          id: itemKey,
          productId: action.payload.productId || action.payload.id,
          quantity: incomingQty 
        });
      }
      const totals = calculateTotals(state.items);
      state.count = totals.count;
      state.subtotal = totals.subtotal;
      state.total = totals.subtotal;
      state.tax = totals.tax;
      state.deliveryFee = totals.deliveryFee;
      state.grandTotal = totals.grandTotal;
    },
    updateQuantity(state, action: PayloadAction<{ id: string; quantity: number }>) {
      const { id, quantity } = action.payload;
      const index = state.items.findIndex(item => item.id === id || getCartItemKey(item) === id);
      if (index !== -1) {
        if (quantity <= 0) {
          state.items.splice(index, 1);
        } else {
          state.items[index].quantity = quantity;
        }
      }
      const totals = calculateTotals(state.items);
      state.count = totals.count;
      state.subtotal = totals.subtotal;
      state.total = totals.subtotal;
      state.tax = totals.tax;
      state.deliveryFee = totals.deliveryFee;
      state.grandTotal = totals.grandTotal;
    },
    removeFromCart(state, action: PayloadAction<string>) {
      const targetId = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === targetId || getCartItemKey(item) === targetId);
      if (existingItemIndex !== -1) {
        if (state.items[existingItemIndex].quantity > 1) {
          state.items[existingItemIndex].quantity -= 1;
        } else {
          state.items.splice(existingItemIndex, 1);
        }
      }
      const totals = calculateTotals(state.items);
      state.count = totals.count;
      state.subtotal = totals.subtotal;
      state.total = totals.subtotal;
      state.tax = totals.tax;
      state.deliveryFee = totals.deliveryFee;
      state.grandTotal = totals.grandTotal;
    },
    deleteFromCart(state, action: PayloadAction<string>) {
      const targetId = action.payload;
      const index = state.items.findIndex(item => item.id === targetId || getCartItemKey(item) === targetId);
      if (index !== -1) {
        state.items.splice(index, 1);
      }
      const totals = calculateTotals(state.items);
      state.count = totals.count;
      state.subtotal = totals.subtotal;
      state.total = totals.subtotal;
      state.tax = totals.tax;
      state.deliveryFee = totals.deliveryFee;
      state.grandTotal = totals.grandTotal;
    },
    clearCart(state) {
      state.items = [];
      state.count = 0;
      state.total = 0;
      state.subtotal = 0;
      state.tax = 0;
      state.deliveryFee = 0;
      state.grandTotal = 0;
    },
  },
});

export const { setCart, addToCart, updateQuantity, removeFromCart, deleteFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
