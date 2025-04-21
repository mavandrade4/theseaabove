import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css'

const NavBar = () => {  
    return (
      <nav className="navbar">
        <div className="navbar-links">
          <Link to="/">HOME</Link>
          <Link to="/timeline">TIMELINE</Link>
          <Link to="/bubbleChart">GROUPS</Link>
        </div>
      </nav>
    );
};

export default NavBar;