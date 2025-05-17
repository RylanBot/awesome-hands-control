import { useEffect } from "react";
import { createHashRouter, Outlet, RouterProvider } from "react-router-dom";

import { updateConfig } from "@/stores/configSlice";
import { useDispatch } from "react-redux";

import { CameraWindowBar, MainWindowBar } from "@/components/WindowBar";
import { Dashboard, EmptySlot, GestureRecognition, SettingPage } from "@/pages";

const MainLayout = () => {
  return (
    <div>
      <MainWindowBar />
      <Outlet />
    </div>
  );
};

const CameraLayout = () => {
  return (
    <div>
      <CameraWindowBar />
      <Outlet />
    </div>
  );
};

const App = () => {

  // 初始化 redux 后才能保证中间件进行监听
  const dispatch = useDispatch();
  useEffect(() => {
    async function initializeConfig() {
      try {
        const config = await window.configApi.initialConfig();
        dispatch(updateConfig(config));
      } catch (error) {
        console.error('Failed to initialize config: ', error);
      }
    }
    initializeConfig();
  }, [dispatch]);

  const routes = [
    {
      path: "/",
      element: <EmptySlot />,
    },
    // 主窗口
    {
      path: "/main",
      element: <MainLayout />,
      children: [
        { index: true, element: <Dashboard /> },
        {
          path: 'setting',
          element: <SettingPage />,
          children: [
            { path: ':software', element: <SettingPage /> }
          ]
        },
      ],
    },
    // 摄像机窗口
    {
      path: "/camera",
      element: <CameraLayout />,
      children: [
        { index: true, element: <GestureRecognition /> },]
    }
  ];

  return <RouterProvider router={createHashRouter(routes)} />;
};

export default App;