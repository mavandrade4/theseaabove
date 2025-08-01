import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';

const Nav = () => {
  const [hovering, setHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    document.body.classList.toggle('menu-open', !menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    document.body.classList.remove('menu-open');
  };

  return (
    <div 
      className="nav-container"
      onMouseEnter={!isMobile ? () => setHovering(true) : undefined}
      onMouseLeave={!isMobile ? () => setHovering(false) : undefined}
    >
      {/* Burger Menu Button - Mobile Only */}
      {isMobile && (
        <button 
          className={`burger-menu ${menuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="Menu"
        >
          <div className="burger-line"></div>
          <div className="burger-line"></div>
          <div className="burger-line"></div>
        </button>
      )}

      {/* Mobile Menu */}
      {isMobile && (
        <div className={`navbar-mobile ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-mobile-links">
            <Link to="/" onClick={closeMenu} style={{ fontFamily: 'Unbounded' }}>The Sea Above</Link>
            <Link to="/timeline" onClick={closeMenu}>Visualization</Link>
            <Link to="/context" onClick={closeMenu}>Context</Link>
            <Link to="/data" onClick={closeMenu}>Data</Link>
            <Link to="/about" onClick={closeMenu}>About</Link>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className={`navbar ${isMobile ? 'mobile-hidden' : ''}`}>
        <div className="navbar-links">
          <Link to="/" onClick={() => setHovering(false)} style={{ fontFamily: 'Unbounded' }}>The Sea Above</Link>
          <Link to="/timeline" onClick={() => setHovering(false)}>Visualization</Link>
          <Link to="/context" onClick={() => setHovering(false)}>Context</Link>
          <Link to="/data" onClick={() => setHovering(false)}>Data</Link>
          <Link to="/about" onClick={() => setHovering(false)}>About</Link>
        </div>
      </nav>
    </div>
  );
};

export default Nav;