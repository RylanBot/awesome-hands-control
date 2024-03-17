import { Middleware } from '@reduxjs/toolkit';
import { getLocalConfig } from './configSlice';

interface MiddlewareState {
  config: {
    lastUpdated: number;
  };
}

/**
 *  引入一个中间件，全局监听 Redux 中的时间戳，
 *  并在其变化时重新获取 electron-store 的配置
 */
export const configMiddleware: Middleware<unknown, MiddlewareState> = store => next => async action => {

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