import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getAllUsers, approveUser, resetPassword } from '../api/admin';
import { User } from '../api/types';

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (email: string, action: 'approve' | 'reject') => {
    try {
      const response = await approveUser({ email, action });
      if (response.success) {
        setMessage(response.message);
        loadUsers();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || '작업 중 오류가 발생했습니다.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail || !newPassword) {
      setMessage('이메일과 새 비밀번호를 모두 입력해주세요.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await resetPassword({ email: resetEmail, newPassword });
      if (response.success) {
        setMessage(response.message);
        setResetEmail('');
        setNewPassword('');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || '비밀번호 초기화 중 오류가 발생했습니다.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'PENDING');

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p>로딩 중...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>관리자 페이지</h2>

        {message && <div className="success-message">{message}</div>}

        {/* 가입 대기 사용자 */}
        <div className="admin-section">
          <h3>가입 대기 사용자 ({pendingUsers.length}명)</h3>
          {pendingUsers.length > 0 ? (
            <div className="table">
              <table>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>역할</th>
                    <th>가입일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge badge-${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt!).toLocaleDateString('ko-KR')}</td>
                      <td>
                        <button
                          className="btn btn-success"
                          onClick={() => handleApprove(user.email, 'approve')}
                        >
                          승인
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleApprove(user.email, 'reject')}
                        >
                          거절
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>가입 대기 중인 사용자가 없습니다.</p>
          )}
        </div>

        {/* 전체 사용자 목록 */}
        <div className="admin-section">
          <h3>전체 사용자 ({users.length}명)</h3>
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>역할</th>
                  <th>상태</th>
                  <th>가입일</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge badge-${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt!).toLocaleDateString('ko-KR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 비밀번호 초기화 */}
        <div className="admin-section">
          <h3>비밀번호 초기화</h3>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="resetEmail">사용자 이메일</label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">새 비밀번호</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="최소 6자 이상"
                  minLength={6}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                비밀번호 초기화
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPage;

