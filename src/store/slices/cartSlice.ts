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
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  imageUrl?: string;
  vendor?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  count: number;
}

const initialState: CartState = {
  items: [],
  total: 0,
  count: 0,
};

const calculateTotals = (items: CartItem[]) => {
  let count = 0;
  let total = 0;
  items.forEach(item => {
    count += item.quantity;
    total += item.price * item.quantity;
  });
  return { count, total };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      const totals = calculateTotals(state.items);
      state.count = totals.count;
      state.total = totals.total;
    },
    addToCart(state, action: PayloadAction<CartItem>) {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
      const totals = calculateTotals(state.items);
      state.count = totals.count;
      state.total = totals.total;
    },
    removeFromCart(state, action: PayloadAction<string>) {
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload);
      if (existingItemIndex !== -1) {
        if (state.items[existingItemIndex].quantity > 1) {
          state.items[existingItemIndex].quantity -= 1;
        } else {
          state.items.splice(existingItemIndex, 1);
        }
      }
      const totals = calculateTotals(state.items);
      state.count = totals.count;
      state.total = totals.total;
    },
    deleteFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(item => item.id !== action.payload);
      const totals = calculateTotals(state.items);
      state.count = totals.count;
      state.total = totals.total;
    },
    clearCart(state) {
      state.items = [];
      state.count = 0;
      state.total = 0;
    },
  },
});

export const { setCart, addToCart, removeFromCart, deleteFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
