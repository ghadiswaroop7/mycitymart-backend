import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FlashDeal {
  id: string;
  productId: string;
  dealPrice: number;
  endsAt: number; // Timestamp in ms
  totalStock: number;
  soldStock: number;
}

interface FlashDealState {
  activeDeals: FlashDeal[];
}

const initialState: FlashDealState = {
  activeDeals: [],
};

const flashDealSlice = createSlice({
  name: 'flashDeals',
  initialState,
  reducers: {
    setActiveDeals(state, action: PayloadAction<FlashDeal[]>) {
      state.activeDeals = action.payload;
    },
  },
});

export const { setActiveDeals } = flashDealSlice.actions;
export default flashDealSlice.reducer;
