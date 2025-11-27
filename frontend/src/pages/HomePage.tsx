import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>환영합니다, {user?.name}님!</h2>
        <p>TMS(Test Management System)에 오신 것을 환영합니다.</p>
        
        <div style={{ marginTop: '32px', padding: '24px', background: 'white', borderRadius: '8px' }}>
          <h3>사용자 정보</h3>
          <p><strong>이메일:</strong> {user?.email}</p>
          <p><strong>역할:</strong> {user?.role}</p>
          <p><strong>상태:</strong> {user?.status}</p>
        </div>
        
        {user?.role === 'ADMIN' && (
          <div style={{ marginTop: '16px', padding: '16px', background: '#fff3cd', borderRadius: '8px' }}>
            <p>📌 관리자 권한으로 로그인하셨습니다. 상단의 "관리자 페이지" 버튼을 클릭하여 사용자를 관리할 수 있습니다.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;

