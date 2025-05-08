import React from 'react';
import { Outlet } from 'react-router';
import Nav from './pages/components/Nav';
import Data from "./pages/components/Data";
import DataContextProvider from './context/dataContext';

export default function Root() {
    return (
        <div>
            <Nav />
            <DataContextProvider data={Data()}>
                <Outlet />
            </DataContextProvider>
        </div>
    )
}