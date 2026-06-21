import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface WishlistState {
  items: string[]; // Store product IDs
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: WishlistState = {
  items: [],
  status: 'idle',
};

// Async Thunks for Firestore
export const syncWishlist = createAsyncThunk(
  'wishlist/sync',
  async (uid: string, { rejectWithValue }) => {
    try {
      if (!uid) return [];
      const docRef = doc(db, 'wishlists', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().items as string[];
      }
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const syncWishlistToFirestore = createAsyncThunk(
  'wishlist/syncWishlistToFirestore',
  async ({ uid, items }: { uid: string, items: string[] }) => {
    const docRef = doc(db, 'wishlists', uid);
    await setDoc(docRef, { items }, { merge: true });
    return items;
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlist(state, action: PayloadAction<string[]>) {
      state.items = action.payload;
    },
    toggleWishlist(state, action: PayloadAction<string>) {
      const index = state.items.indexOf(action.payload);
      if (index !== -1) {
        state.items.splice(index, 1);
      } else {
        state.items.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(syncWishlist.fulfilled, (state, action) => {
      state.items = action.payload;
      state.status = 'succeeded';
    });
  }
});

export const { setWishlist, toggleWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
