import React, { useContext, useState } from 'react';
import { TextInput, Button, InlineNotification } from '@carbon/react';
import { View, ViewOff } from '@carbon/icons-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SignIn.scss';
import { AuthContext } from '../../context/AuthContext';

const SignIn = () => {
  const navigate = useNavigate();
  const [token, setToken]=useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:4000/api/teams/login', formData);
      console.log("Full response",response);
      //setToken(response.data.token);
      localStorage.setItem('token', response.data.token)
      console.log("token",localStorage.getItem(token));
      if (response.status === 200) {
        navigate('/home');
      }
    } catch (error) {
      if (error.response) {
        const serverMessage = error.response.data?.error || 'Login failed';
        setErrorMessage(
          error.response.status === 401
            ? 'Invalid username or password!'
            : `Error: ${serverMessage}`
        );
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="sign-in">
      <form className="sign-in-form" onSubmit={handleSubmit}>
        <h1 className="sign-in-title">Log in to IBM SprintScribe</h1>

        <TextInput
          id="username"
          labelText="Username"
          placeholder="Enter username"
          value={formData.username}
          onChange={handleChange('username')}
          className="sign-in-input"
        />

        <div className="password-wrapper">
          <TextInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            labelText="Password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange('password')}
            className="sign-in-input"
          />
          <button
            type="button"
            className="toggle-password-icon"
            onClick={togglePasswordVisibility}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <ViewOff size={20} /> : <View size={20} />}
          </button>
        </div>

        <Button type="submit" kind="primary" className="sign-in-button">
          Continue
        </Button>

        {errorMessage && (
          <InlineNotification
            kind="error"
            title="Login Failed"
            subtitle={errorMessage}
            className="sign-in-error"
            lowContrast
          />
        )}
      </form>
    </div>
  );
};

export default SignIn;


