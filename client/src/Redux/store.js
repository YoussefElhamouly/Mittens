import { configureStore } from '@reduxjs/toolkit';
import userDataReducer from './Slices/userDataSlice';

export const store = configureStore({
  reducer: {
    userData: userDataReducer,
  },
});
