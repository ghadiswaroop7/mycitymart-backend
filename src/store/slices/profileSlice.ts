import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export interface Profile {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  city?: string;
  location?: string;
  addressType?: string;
  phoneNumber?: string | null;
}

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null,
};

export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (uid: string, { rejectWithValue }) => {
    try {
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // If city or location is missing, we populate defaults and save back to firestore
        if (!data.city || !data.location) {
          const updated = {
            city: data.city || 'Thane',
            location: data.location || 'Swaroop Nagar, Thane',
          };
          await setDoc(userRef, updated, { merge: true });
          return { uid, ...data, ...updated } as Profile;
        }
        return { uid, ...data } as Profile;
      } else {
        // Create new user profile document with defaults if not exists
        const newProfile = {
          uid,
          city: 'Thane',
          location: 'Swaroop Nagar, Thane',
          displayName: 'User',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        return newProfile as Profile;
      }
    } catch (error: any) {
      console.error('fetchUserProfile thunk error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<Profile | null>) {
      state.profile = action.payload;
      state.isLoading = false;
    },
    setProfileLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    clearProfile(state) {
      state.profile = null;
      state.isLoading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setProfile, setProfileLoading, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
