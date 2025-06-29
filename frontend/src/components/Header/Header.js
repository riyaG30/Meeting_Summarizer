import React from 'react';
import './Header.scss';
import ibmLogo from '../../assets/ibmlogo.png';

const Header = () => {
  const userProfile = {
    name: 'Test user',
    company: 'Test.user Trial Company 173071154780'
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h5 className="header-title">IBM SprintScribe</h5>
        </div>
        <div className="header-right">
          <div className="user-profile">
            {/* <span className="user-icon">
              <i className="fas fa-user"></i>
            </span> */}
            {/* <span className="user-name">{userProfile.name}</span> */}
          </div>
          <img src={ibmLogo} alt="IBM Logo" className="ibm-logo" />
        </div>
      </div>
    </header>
  );
};

export default Header;