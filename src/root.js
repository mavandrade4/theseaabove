import React from 'react';
import { Outlet } from 'react-router';
import NavBar from './components/Nav';

export default function Root() {
    return (
        <div>
            <NavBar />
            <Outlet />
        </div>
    )
}