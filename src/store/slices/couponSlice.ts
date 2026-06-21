import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Coupon {
  id: string;
  code: string;
  discountAmount?: number;
  discountPercent?: number;
  description: string;
  minPurchase?: number;
}

interface CouponState {
  availableCoupons: Coupon[];
  appliedCoupon: Coupon | null;
  discount: number;
}

const initialState: CouponState = {
  availableCoupons: [],
  appliedCoupon: null,
  discount: 0,
};

const couponSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {
    setAvailableCoupons(state, action: PayloadAction<Coupon[]>) {
      state.availableCoupons = action.payload;
    },
    applyCoupon(state, action: PayloadAction<{ coupon: Coupon; cartTotal: number }>) {
      const { coupon, cartTotal } = action.payload;
      if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
        return; // Failed min purchase validation
      }
      state.appliedCoupon = coupon;
      if (coupon.discountAmount) {
        state.discount = coupon.discountAmount;
      } else if (coupon.discountPercent) {
        state.discount = (cartTotal * coupon.discountPercent) / 100;
      }
    },
    removeCoupon(state) {
      state.appliedCoupon = null;
      state.discount = 0;
    },
  },
});

export const { setAvailableCoupons, applyCoupon, removeCoupon } = couponSlice.actions;
export default couponSlice.reducer;
