import { configureStore } from '@reduxjs/toolkit';
import configReducer from './configSlice';
import { configMiddleware } from './configMiddleware';

export const store = configureStore({
  reducer: {
    config: configReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(configMiddleware),
});
