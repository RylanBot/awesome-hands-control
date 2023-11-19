import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

import { CameraWindowBar, MainWindowBar } from "./components/WindowBar";
import Dashboard from "./pages/Dashboard";
import GestureRecognition from "./pages/GestureRecognition";
import SettingPage from "./pages/SettingPage";

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
  const routes = [
    // 主窗口
    {
      path: "/",
      element: <MainLayout />,
      children: [
        { index: true, element: <Dashboard /> }, // 根路径
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

  return <RouterProvider router={createBrowserRouter(routes)} />;
};

export default App;