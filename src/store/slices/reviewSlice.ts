import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  text: string;
  helpfulCount: number;
}

interface ReviewState {
  reviews: Review[];
  userReview: Review | null;
  loading: boolean;
}

const initialState: ReviewState = {
  reviews: [],
  userReview: null,
  loading: false,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    setReviews(state, action: PayloadAction<Review[]>) {
      state.reviews = action.payload;
    },
    setUserReview(state, action: PayloadAction<Review | null>) {
      state.userReview = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    addReviewToState(state, action: PayloadAction<Review>) {
      state.reviews.unshift(action.payload);
      state.userReview = action.payload;
    },
  },
});

export const { setReviews, setUserReview, setLoading, addReviewToState } = reviewSlice.actions;
export default reviewSlice.reducer;
