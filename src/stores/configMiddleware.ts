/*  引入一个中间件，全局监听 Redux 中的时间戳，
    并在其变化时重新获取 electron-store 的配置*/

import { Middleware } from '@reduxjs/toolkit';
import { getLocalConfig } from './configSlice';

interface MiddlewareState {
  config: {
    lastUpdated: number;
  };
}

export const configMiddleware: Middleware<{}, MiddlewareState> = store => next => async action => {

  const previousLastUpdated = store.getState().config.lastUpdated;
  next(action);
  const currentLastUpdated = store.getState().config.lastUpdated;

  if (previousLastUpdated !== currentLastUpdated) {
    try {
      const config = await window.configApi.initialConfig();
      store.dispatch(getLocalConfig(config));
    } catch (error) {
      console.error('Failed to fetch config: ', error);
    }
  }
}