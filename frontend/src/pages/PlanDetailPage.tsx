import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPlanDetail, PlanDetail, updatePlanItem, bulkUpdatePlanItems, TestResult } from '../api/plan';
import { getAllUsers } from '../api/admin';
import { User } from '../api/types';
import { ArrowLeft, MessageSquare, CheckSquare, Square, PieChart, Clock, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

// Auto Link Component
const AutoLinkText = ({ text }: { text?: string }) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <span>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a 
              key={index} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:underline" 
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </span>
  );
};

// Comment Modal Component
interface CommentModalProps {
  isOpen: boolean;
  initialComment?: string;
  onClose: () => void;
  onSave: (comment: string) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, initialComment, onClose, onSave }) => {
  const [comment, setComment] = useState(initialComment || '');

  useEffect(() => {
    setComment(initialComment || '');
  }, [initialComment, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
        <h3 className="text-lg font-bold mb-4 text-slate-900">Add Comment</h3>
        <textarea
          className="w-full border border-slate-300 rounded-md p-3 h-32 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Enter your comment here (URLs will be auto-linked)..."
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(comment)}>
            Save Comment
          </Button>
        </div>
      </div>
    </div>
  );
};

const PlanDetailPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<User[]>([]);
  
  // Comment Modal State
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string>('');

  // Bulk Update State
  const [bulkResult, setBulkResult] = useState<TestResult | ''>('');
  const [bulkAssignee, setBulkAssignee] = useState<string>('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (planId) {
      loadPlanDetail(planId);
    }
    loadUsers();
  }, [planId]);

  const loadUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response.success) {
        // ACTIVE 상태인 사용자만 필터링
        setUsers(response.users.filter(u => u.status === 'ACTIVE'));
      }
    } catch (error) {
      console.error('Failed to load users', error);
    }
  };

  const loadPlanDetail = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await getPlanDetail(id);
      if (response.success) {
        setPlan(response.data);
      }
    } catch (error) {
      console.error('Failed to load plan detail', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (!plan) return;
    if (selectedItems.size === plan.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(plan.items.map(i => i.id)));
    }
  };

  const handleResultChange = async (itemId: string, newResult: TestResult) => {
    if (!planId) return;
    try {
      await updatePlanItem(planId, itemId, { result: newResult });
      loadPlanDetail(planId);
    } catch (error) {
      alert('Failed to update result');
    }
  };

  const openCommentModal = (itemId: string, currentComment?: string) => {
    setEditingItemId(itemId);
    setEditingComment(currentComment || '');
    setIsCommentModalOpen(true);
  };

  const handleSaveComment = async (comment: string) => {
    if (!planId || !editingItemId) return;
    try {
      await updatePlanItem(planId, editingItemId, { comment });
      setIsCommentModalOpen(false);
      loadPlanDetail(planId);
    } catch (error) {
      alert('Failed to save comment');
    }
  };

  const handleAssigneeChange = async (itemId: string, newAssignee: string) => {
    if (!planId) return;
    try {
      await updatePlanItem(planId, itemId, { assignee: newAssignee || undefined });
      loadPlanDetail(planId);
    } catch (error) {
      alert('Failed to update assignee');
    }
  };

  const handleBulkUpdate = async () => {
    if (!planId || selectedItems.size === 0) return;
    if (!bulkResult && !bulkAssignee) {
      alert('Please select a status or assignee to apply.');
      return;
    }

    const updates: any = { items: Array.from(selectedItems) };
    if (bulkResult) updates.result = bulkResult;
    if (bulkAssignee) updates.assignee = bulkAssignee;

    const confirmMsg = `Apply changes to ${selectedItems.size} selected items?\n${
      bulkResult ? `- Status: ${bulkResult}\n` : ''
    }${bulkAssignee ? `- Assignee: ${bulkAssignee}` : ''}`;
    
    if (!confirm(confirmMsg)) return;

    try {
      await bulkUpdatePlanItems(planId, updates);
      setSelectedItems(new Set());
      setBulkResult('');
      setBulkAssignee('');
      loadPlanDetail(planId);
    } catch (error) {
      alert('Bulk update failed');
    }
  };

  if (isLoading && !plan) return <div className="flex justify-center items-center h-screen text-slate-500">Loading...</div>;
  if (!plan) return <div className="flex justify-center items-center h-screen text-slate-500">Plan not found.</div>;

  const totalItems = plan.items.length;
  const selectedCount = selectedItems.size;
  const passCount = plan.items.filter(i => i.result === 'PASS').length;
  const failCount = plan.items.filter(i => i.result === 'FAIL').length;
  const blockCount = plan.items.filter(i => i.result === 'BLOCK').length;
  const notRunCount = plan.items.filter(i => i.result === 'NOT_RUN').length;
  const progress = totalItems > 0 ? Math.round(((totalItems - notRunCount) / totalItems) * 100) : 0;

  return (
    <div className="p-8 w-full mx-auto max-w-[1800px]">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/plans')}
        className="flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors text-sm"
      >
        <ArrowLeft size={18} className="mr-2" /> Back to Plans
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-indigo-50 p-2.5 rounded-lg">
                <PieChart size={24} className="text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{plan.name}</h1>
                <Badge variant={plan.status === 'ACTIVE' ? 'success' : 'neutral'} className="mt-1">
                  {plan.status}
                </Badge>
              </div>
            </div>
            <p className="text-slate-600 mb-4 max-w-3xl">{plan.description || 'No description provided.'}</p>
            
            <div className="flex gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Created by <span className="font-medium text-slate-700">{plan.createdBy}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="w-80 bg-slate-50 rounded-lg border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
              <span className="text-lg font-bold text-indigo-600">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between items-center px-3 py-2 bg-white rounded-md border border-slate-200">
                <span className="text-slate-600">Passed</span>
                <span className="font-bold text-emerald-600">{passCount}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 bg-white rounded-md border border-slate-200">
                <span className="text-slate-600">Failed</span>
                <span className="font-bold text-red-600">{failCount}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 bg-white rounded-md border border-slate-200">
                <span className="text-slate-600">Blocked</span>
                <span className="font-bold text-gray-600">{blockCount}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 bg-white rounded-md border border-slate-200">
                <span className="text-slate-600">Untested</span>
                <span className="font-bold text-gray-400">{notRunCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-indigo-600" />
            <span className="font-semibold text-indigo-900 text-sm">{selectedCount} selected</span>
          </div>
          <div className="h-6 w-px bg-indigo-200"></div>
          <div className="flex items-center gap-3">
            <select
              value={bulkResult}
              onChange={(e) => setBulkResult(e.target.value as TestResult)}
              className="border-slate-300 rounded-md text-sm py-1.5 pl-3 pr-8 focus:ring-indigo-500 focus:border-indigo-500 bg-white [&>option]:bg-white [&>option]:text-slate-900"
            >
              <option value="">Set status to...</option>
              <option value="NOT_RUN">NOT STARTED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
              <option value="BLOCK">BLOCKED</option>
            </select>
            <select
              value={bulkAssignee}
              onChange={(e) => setBulkAssignee(e.target.value)}
              className="border-slate-300 rounded-md text-sm py-1.5 pl-3 pr-8 focus:ring-indigo-500 focus:border-indigo-500 bg-white [&>option]:bg-white [&>option]:text-slate-900"
            >
              <option value="">Set assignee to...</option>
              {users.map(user => (
                <option key={user.id} value={user.name}>{user.name}</option>
              ))}
            </select>
            <Button
              onClick={handleBulkUpdate}
              disabled={!bulkResult && !bulkAssignee}
              size="sm"
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">
                  <button 
                    onClick={handleSelectAll}
                    className="text-slate-500 hover:text-slate-700 focus:outline-none transition-colors"
                    title={selectedItems.size === totalItems ? "Deselect All" : "Select All"}
                  >
                    {selectedItems.size > 0 && selectedItems.size === totalItems ? 
                      <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />
                    }
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Comment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Executed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {plan.items.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${selectedItems.has(item.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-4 py-4 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleToggleSelect(item.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-middle">
                    <select
                      value={item.result}
                      onChange={(e) => handleResultChange(item.id, e.target.value as TestResult)}
                      className={`text-[10px] font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 w-full text-center h-6 appearance-none uppercase tracking-wide
                        ${item.result === 'PASS' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 
                          item.result === 'FAIL' ? 'bg-red-500 text-white hover:bg-red-600' : 
                          item.result === 'BLOCK' ? 'bg-gray-600 text-white hover:bg-gray-700' :
                          item.result === 'IN_PROGRESS' ? 'bg-amber-500 text-white hover:bg-amber-600' : 
                          'bg-gray-400 text-white hover:bg-gray-500'}
                        [&>option]:bg-white [&>option]:text-slate-900 [&>option]:text-center [&>option]:py-2 [&>option]:text-[10px] [&>option]:font-medium [&>option]:uppercase`}
                    >
                      <option value="NOT_RUN">NOT STARTED</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                      <option value="BLOCK">BLOCKED</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono align-middle">
                    {item.testCase.caseNumber ? `OVDR${String(item.testCase.caseNumber).padStart(4, '0')}` : item.testCaseId.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="text-sm font-medium text-slate-900">{item.testCase.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-middle">
                    <Badge 
                      variant={
                        item.testCase.priority === 'HIGH' ? 'error' :
                        item.testCase.priority === 'MEDIUM' ? 'warning' : 'info'
                      }
                      className="uppercase tracking-wide text-[10px] font-semibold"
                    >
                      {item.testCase.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-middle">
                    <select
                      value={item.assignee || ''}
                      onChange={(e) => handleAssigneeChange(item.id, e.target.value)}
                      className={`text-[10px] font-medium uppercase tracking-wide rounded-full px-3 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 w-full text-center h-6 appearance-none
                        ${item.assignee ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-slate-300 text-white hover:bg-slate-400'}
                        [&>option]:bg-white [&>option]:text-slate-900 [&>option]:text-center [&>option]:py-2 [&>option]:text-[10px] [&>option]:font-medium [&>option]:uppercase [&>option]:tracking-wide`}
                    >
                      <option value="">Unassign</option>
                      {users.map(user => (
                        <option key={user.id} value={user.name}>{user.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 align-middle">
                    <div className="flex items-center gap-2 group">
                       <button 
                        onClick={() => openCommentModal(item.id, item.comment)}
                        className={`p-1.5 rounded-full hover:bg-slate-100 transition-colors ${item.comment ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 group-hover:text-slate-500'}`}
                        title={item.comment ? "Edit Comment" : "Add Comment"}
                      >
                        <MessageSquare size={16} />
                      </button>
                      {item.comment && (
                        <div className="line-clamp-1 break-all text-xs text-slate-600 max-w-xs">
                          <AutoLinkText text={item.comment} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-xs align-middle">
                    {item.executedAt ? (
                      <div className="flex flex-col">
                        <span>{new Date(item.executedAt).toLocaleDateString()}</span>
                        <span className="text-slate-400">{new Date(item.executedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        initialComment={editingComment}
        onClose={() => setIsCommentModalOpen(false)}
        onSave={handleSaveComment}
      />
    </div>
  );
};

export default PlanDetailPage;
