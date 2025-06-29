import React from "react";
import './NavBar.scss'

const NavBar = ()=> {
    return (
        <div className="navbar">
            <div className="navbar-header">
                <h2>Dashboard</h2>
            </div>
            <div className="company-info">
                <span className="heading">TEAM :</span>
                <span className="company-name">Resilience Engineering</span>
            </div>
        </div>
    );
}

export default NavBar;