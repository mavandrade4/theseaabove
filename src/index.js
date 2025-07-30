import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import "./App.css";
import reportWebVitals from './reportWebVitals';
import {
  createHashRouter, 
  RouterProvider,
} from "react-router-dom";
import LoadingScreen from "./pages/components/LoadingScreen";
import Root from './root';
import App from './App';

import Groups from './pages/components/Groups';
import Timeline from './pages/Timeline';
const Context = React.lazy(() => import('./pages/Context'));
const About = React.lazy(() => import('./pages/About'));
const Project = React.lazy(() => import('./pages/Project'));

const router = createHashRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: <App />
      },
      {
        path: "/timeline",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <Timeline />
          </Suspense>
        ),
      },
      {
        path: "/groups",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <Groups />
          </Suspense>
        ),
      },
      {
        path: "/data",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <Project />
          </Suspense>
        ),
      },
      {
        path: "/context",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <Context />
          </Suspense>
        ),
      },
      {
        path: "/about",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <About />
          </Suspense>
        ),
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
