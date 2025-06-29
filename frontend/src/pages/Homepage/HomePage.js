import React from 'react';
import './HomePage.scss';
import Header from '../../components/Header/Header';
import NavBar from '../../components/NavBar/NavBar';
import Upload from '../../components/Upload/Upload';
import StandUpSummary from '../../components/Summary/StandUpSummary';
import History from '../../components/History/History';

const HomePage = () => {
  return (
    <div className="home-page">
      <Header />
      <NavBar />
      <div className="content-container">
        <div className="left-column">
          <div className="up-component">
            <Upload />
          </div>
          <div className='down-component'>
            <StandUpSummary/>
          </div>
        </div>
        <div className="right-column">
          <History />
        </div>
      </div>
    </div>
  );
};
export default HomePage;
