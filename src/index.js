import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import "./App.css";
import reportWebVitals from './reportWebVitals';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import Root from './root';
import Timeline from './pages/Timeline';
import Groups from './pages/Groups';
import Context from './pages/Context';
import About from './pages/About';
import Project from './pages/Project';

const router = createBrowserRouter([
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
        element: <Timeline />,
      },
      {
        path: "/groups",
        element: <Groups />,
      },
      {
        path: "/data",
        element: <Project />,
      },
      {
        path: "/context",
        element: <Context />,
      },
      {
        path: "/about",
        element: <About />,
      },
    ]
  },
 
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
