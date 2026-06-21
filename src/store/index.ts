import { configureStore } from '@reduxjs/toolkit';
import productReducer from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import wishlistReducer from './slices/wishlistSlice';
import reviewReducer from './slices/reviewSlice';
import couponReducer from './slices/couponSlice';
import flashDealReducer from './slices/flashDealSlice';
import orderReducer from './slices/orderSlice';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    products: productReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    reviews: reviewReducer,
    coupons: couponReducer,
    flashDeals: flashDealReducer,
    order: orderReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Useful when dealing with Firebase Timestamps
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
