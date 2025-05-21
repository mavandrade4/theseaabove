import React from 'react';
import { Link } from 'react-router-dom';
import './Nav.css'

const Nav = () => {  
    return (
      <nav className="navbar">
        <div className="navbar-links">
          <Link to="/" style={{fontFamily: 'Unbounded'}}>SPACE DECAY</Link>
          <Link to="/timeline">project TIMELINE</Link>
          
          <Link to="/">context</Link>
          <Link to="/">about</Link>
        </div>
      </nav>
    );
};

export default Nav;
