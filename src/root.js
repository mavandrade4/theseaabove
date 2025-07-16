import React, { useState } from 'react';
import { Outlet } from 'react-router-dom'; // ← fix here too
import Nav from './pages/components/Nav';
import Footer from './pages/components/Footer';
import Data from "./pages/components/Data";
import DataContextProvider from './context/dataContext';
import AnimationContextProvider from './context/AnimationContext'; // ← import this

export default function Root() {
  const [hideFooter, setHideFooter] = useState(false);

  return (
    <div>
      <Nav />
      <DataContextProvider data={Data()}>
        <AnimationContextProvider>
          <Outlet context={{ hideFooter, setHideFooter }} />
        </AnimationContextProvider>
      </DataContextProvider>
      <Footer hide={hideFooter} />
    </div>
  );
}
