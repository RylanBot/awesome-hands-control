import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ConfigState {
  apps: {
    [appName: string]: {
      icon: string;
      shortcut: {
        [key: string]: [string, string];
      };
    };
  };
}


const initialState: ConfigState = {
  apps: {},
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<ConfigState['apps']>) => {
      state.apps = action.payload;
    },
  },
});

export const { setConfig } = configSlice.actions;
export default configSlice.reducer;
