/*  引入中间件后，
    RootState 类型依赖于 store 的定义，
    而 store 又依赖于 RootState（通过中间件），
    则需拆分代码的结构来避免循环引用。
*/

import { store } from './store';

// RootState 能在应用中方便地引用整个 Redux state 的类型
export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;