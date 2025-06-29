import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Homepage/HomePage';
import LoginPage from './pages/Loginpage/LoginPage';
import { ParsedProvider } from './context/ParsedContext'; // 👈 import the provider
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
    <ParsedProvider> {/* 👈 wrap your Router in the context */}
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />
          </Routes>
        </div>
      </Router>
    </ParsedProvider>
    </AuthProvider>
  );
}

export default App;
