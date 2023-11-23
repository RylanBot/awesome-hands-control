import { configureStore } from '@reduxjs/toolkit';
import configReducer from './configSlice';

export const store = configureStore({
  reducer: {
    config: configReducer,
  },
});



// RootState 能在应用中方便地引用整个 Redux state 的类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
