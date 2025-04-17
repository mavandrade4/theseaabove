import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';

const NavBar = () => {  
    return (
      <nav className="navbar">
        <div className="navbar-links">
          <Link to="/home">HOME</Link>
          <Link to="/timeline">TIMELINE</Link>
          <Link to="/bubbleChart">BUBBLE CHART</Link>
        </div>
      </nav>
    );
};

export default NavBar;