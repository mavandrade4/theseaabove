import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Nav from './pages/components/Nav';
import Footer from './pages/components/Footer';
import Data from "./pages/components/Data";
import DataContextProvider from './context/dataContext';
import AnimationContextProvider from './context/AnimationContext';

export default function Root() {
  return (
    <div>
      <Nav />
      <DataContextProvider data={Data()}>
        <AnimationContextProvider>
          <Outlet />
        </AnimationContextProvider>
      </DataContextProvider>
    </div>
  );
}
