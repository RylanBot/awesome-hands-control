import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface AppConfig {
  name: string;
  icon: string;
  shortcut: {
    [key: string]: [string, string];
  };
}

interface ConfigState {
  apps: AppConfig[];
  lastUpdated: number;
}

const initialState: ConfigState = {
  apps: [],
  lastUpdated: Date.now(),
};


const configSlice = createSlice({
  name: 'config', // 对应获取state时候需要添加的后缀（如state.config)
  initialState,
  reducers: {
    // 根据 electron-store 返回的数据整个替换
    getLocalConfig: (state, action: PayloadAction<AppConfig[]>) => {
      state.apps = action.payload;
    },
    updateTimestamp: (state) => {
      state.lastUpdated = Date.now(); // 更新时间戳
    },
  },
});

export const { getLocalConfig, updateTimestamp } = configSlice.actions;
export default configSlice.reducer;
