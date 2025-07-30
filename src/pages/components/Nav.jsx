import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Nav.css';

const Nav = () => {
  const [hovering, setHovering] = useState(false);

  return (
    <div 
      className="nav-container"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >

      <nav className={`navbar ${hovering ? 'shown' : 'hidden'}`}>
        <div className="navbar-links">
          <Link to="/" onClick={() => setHovering(false)} style={{ fontFamily: 'Unbounded' }}>The Sea Above</Link>
          <Link to="/timeline" onClick={() => setHovering(false)}>visualization</Link>
          <Link to="/context" onClick={() => setHovering(false)}>context</Link>
          <Link to="/data" onClick={() => setHovering(false)}>data</Link>
          <Link to="/about" onClick={() => setHovering(false)}>about</Link>
        </div>
      </nav>
    </div>
  );
};

export default Nav;
