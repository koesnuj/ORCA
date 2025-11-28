import React, { useEffect, useState } from 'react';
import { getAllUsers, approveUser, resetPassword } from '../api/admin';
import { User } from '../api/types';
import { Shield, Users, Key, Check, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

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
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await approveUser({ email, action });
      loadUsers();
      setMessage(`User ${action}d successfully.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert('Operation failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !newPassword) return;

    try {
      setIsResetting(true);
      await resetPassword({ email: resetEmail, newPassword });
      setMessage('Password reset successfully.');
      setResetEmail('');
      setNewPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert('Password reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'PENDING');

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

  return (
    <div className="p-8 w-full mx-auto max-w-[1800px]">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm">
          <Shield size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Administration</h2>
          <p className="text-slate-500">Manage users, roles, and system settings.</p>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium shadow-sm flex items-center">
          <Check className="w-4 h-4 mr-2" />
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main User List */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Approvals */}
          {pendingUsers.length > 0 && (
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-amber-500" />
                  Pending Approvals
                  <Badge variant="warning" className="ml-2">{pendingUsers.length}</Badge>
                </div>
              }
              noPadding
            >
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {pendingUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(user.createdAt!).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button 
                          onClick={() => handleApprove(user.email, 'approve')}
                          className="text-emerald-600 hover:text-emerald-900 font-medium text-xs uppercase tracking-wide"
                        >
                          Approve
                        </button>
                        <span className="text-slate-300">|</span>
                        <button 
                          onClick={() => handleApprove(user.email, 'reject')}
                          className="text-rose-600 hover:text-rose-900 font-medium text-xs uppercase tracking-wide"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* All Users */}
          <Card title="All Users" noPadding>
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.role === 'ADMIN' ? 'primary' : 'neutral'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.status === 'ACTIVE' ? 'success' : 'error'}>
                        {user.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card title="Password Reset" className="sticky top-24">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label="User Email"
                type="email"
                placeholder="user@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Min. 6 chars"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full"
                isLoading={isResetting}
              >
                Reset Password
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
