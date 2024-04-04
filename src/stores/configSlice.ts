import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { AppConfig } from '../../common/types/config';

interface ConfigState {
  apps: AppConfig[];
  lastUpdated: number;
}

const initialState: ConfigState = {
  apps: [],
  lastUpdated: Date.now(),
};

const configSlice = createSlice({
  name: 'config', // 对应获取 state 时候需要添加的后缀（如 state.config)
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
