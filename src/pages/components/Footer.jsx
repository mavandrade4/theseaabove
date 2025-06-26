import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
const Footer = () => {
  return (
    <div className="footer">
      <div className="footer-title">
        <Link to="/" style={{ fontFamily: "Unbounded" }}>
          SPACE DECAY
        </Link>
      </div>
      <div className="footer-text">
        <p>It's not science fiction, It's our shared responsibility.</p>
      </div>
      <div className="footer-links">
        <Link to="/project">data</Link>
        <a href="https://www.uc.pt/">uc</a>
        <a href="https://www.neuraspace.com">neuraspace</a>
        <a href="https://www.cisuc.uc.pt/en">cisuc</a>
        <Link to="/about">about</Link>
      </div>
    </div>
  );
};

export default Footer;
