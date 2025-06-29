import React from 'react';
import { Grid, Row, Column } from '@carbon/react';
import SignIn from '../../components/SignIn/SignIn';
import './LoginPage.scss';
import dummyImage from './dummy.png';

const LoginPage = () => {
  return (
    <div className="login-page">
      <Grid fullWidth className="login-grid">
        <Row className="login-row">
          {/* Left side: SignIn form */}
          <Column lg={6} md={6} sm={12} className="login-form-column">
            <SignIn />
          </Column>

          {/* Right side: Image */}
          <Column lg={6} md={6} sm={12} className="login-image-column">
            <div className="login-image-wrapper">
              <img
                src={dummyImage}
                alt="Decorative"
                className="login-image"
              />
            </div>
          </Column>
        </Row>
      </Grid>
    </div>
  );
};

export default LoginPage;
