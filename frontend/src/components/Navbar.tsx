import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1>TMS - Test Management System</h1>
        <div className="navbar-user">
          <span>{user.name}</span>
          <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
            {user.role}
          </span>
          {user.role === 'ADMIN' && (
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/admin')}
              style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }}
            >
              관리자 페이지
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

