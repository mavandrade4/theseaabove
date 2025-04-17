import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './pages/App';
import reportWebVitals from './reportWebVitals';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";

import BubbleChart2 from './pages/BubbleChart';
import Timeline from './pages/Timeline';

import Root from './root';

const router = createBrowserRouter([
  {
    path: "/home",
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
        path: "/bubbleChart",
        element: <BubbleChart2 />,
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
