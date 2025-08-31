import React from "react";
import { Link } from "react-router-dom";
import "../../App.css";

const Footer = ({ hide }) => {
  if (hide) return null;

  return (
    <footer className="footer">
      <div className="footer-title">
        <Link to="/" style={{ fontFamily: "Unbounded" }}>
          THE SEA ABOVE
        </Link>
      </div>
      <div className="footer-text">
        <p>It's not science fiction, It's our shared responsibility.</p>
      </div>
      <div className="footer-links">
        <a href="https://www.uc.pt/">uc</a>
        <a href="https://www.neuraspace.com">neuraspace</a>
        <a href="https://www.cisuc.uc.pt/en">cisuc</a>
      </div>
    </footer>
  );
};

export default Footer;
