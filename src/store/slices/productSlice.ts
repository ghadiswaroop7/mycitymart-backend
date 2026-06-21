import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ProductState {
  currentProduct: any | null;
  relatedProducts: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  currentProduct: null,
  relatedProducts: [],
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setCurrentProduct(state, action: PayloadAction<any>) {
      state.currentProduct = action.payload;
    },
    setRelatedProducts(state, action: PayloadAction<any[]>) {
      state.relatedProducts = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setCurrentProduct, setRelatedProducts, setLoading, setError } = productSlice.actions;
export default productSlice.reducer;
