import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, User, AlertCircle, CheckCircle2, ListChecks } from 'lucide-react';
import { PlanItem, TestResult } from '../api/plan';
import { User as UserType } from '../api/types';
import { Badge } from './ui/Badge';

interface TestCaseDetailPanelProps {
  planItem: PlanItem | null;
  users: UserType[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (itemId: string, updates: { result?: TestResult; assignee?: string; comment?: string }) => void;
}

export const TestCaseDetailPanel: React.FC<TestCaseDetailPanelProps> = ({
  planItem,
  users,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [localResult, setLocalResult] = useState<TestResult>('NOT_RUN');
  const [localAssignee, setLocalAssignee] = useState<string>('');
  const [localComment, setLocalComment] = useState<string>('');
  const panelRef = useRef<HTMLDivElement>(null);

  // 패널이 열릴 때마다 현재 아이템 데이터로 초기화
  useEffect(() => {
    if (planItem) {
      setLocalResult(planItem.result);
      setLocalAssignee(planItem.assignee || '');
      setLocalComment(planItem.comment || '');
    }
  }, [planItem]);

  // ESC 키로 패널 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 배경 클릭 시 닫기 (패널 영역 외부 클릭)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Result 변경 시 즉시 업데이트
  const handleResultChange = (newResult: TestResult) => {
    setLocalResult(newResult);
    if (planItem) {
      onUpdate(planItem.id, { result: newResult });
    }
  };

  // Assignee 변경 시 즉시 업데이트
  const handleAssigneeChange = (newAssignee: string) => {
    setLocalAssignee(newAssignee);
    if (planItem) {
      onUpdate(planItem.id, { assignee: newAssignee });
    }
  };

  // Comment 저장
  const handleCommentSave = () => {
    if (planItem) {
      onUpdate(planItem.id, { comment: localComment });
    }
  };

  if (!isOpen || !planItem) return null;

  // Status별 색상 매핑
  const getStatusColor = (status: TestResult) => {
    switch (status) {
      case 'PASS':
        return 'bg-emerald-500 text-white';
      case 'FAIL':
        return 'bg-red-500 text-white';
      case 'BLOCK':
        return 'bg-gray-600 text-white';
      case 'IN_PROGRESS':
        return 'bg-amber-500 text-white';
      case 'NOT_RUN':
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getStatusLabel = (status: TestResult) => {
    switch (status) {
      case 'NOT_RUN':
        return 'NOT STARTED';
      case 'IN_PROGRESS':
        return 'IN PROGRESS';
      case 'BLOCK':
        return 'BLOCKED';
      default:
        return status;
    }
  };

  // Steps 파싱 (줄바꿈 기준)
  const steps = planItem.testCase.steps?.split('\n').filter(s => s.trim()) || [];

  return (
    <>
      {/* Backdrop (반투명 배경) */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={handleBackdropClick}
      />

      {/* Slide-in Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {planItem.testCaseId.substring(0, 8).toUpperCase()}
              </span>
              <Badge
                variant={
                  planItem.testCase.priority === 'HIGH' ? 'error' :
                  planItem.testCase.priority === 'MEDIUM' ? 'warning' : 'info'
                }
                className="text-[10px] font-semibold uppercase"
              >
                {planItem.testCase.priority}
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-slate-900 line-clamp-2">
              {planItem.testCase.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close (ESC)"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Assigned To */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <User size={14} className="inline mr-1" />
              Assigned To
            </label>
            <select
              value={localAssignee}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className={`w-full text-[11px] font-medium uppercase tracking-wide rounded-full px-4 py-2 border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 text-center h-8 appearance-none transition-colors
                ${localAssignee ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-slate-300 text-white hover:bg-slate-400'}
                [&>option]:bg-white [&>option]:text-slate-900 [&>option]:text-center [&>option]:py-2 [&>option]:text-[11px] [&>option]:font-medium [&>option]:normal-case`}
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.name}>{user.name}</option>
              ))}
            </select>
          </div>

          {/* Result Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <AlertCircle size={14} className="inline mr-1" />
              Result
            </label>
            <select
              value={localResult}
              onChange={(e) => handleResultChange(e.target.value as TestResult)}
              className={`w-full text-[11px] font-medium uppercase tracking-wide rounded-full px-4 py-2 border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 text-center h-8 appearance-none transition-colors
                ${getStatusColor(localResult)}
                [&>option]:bg-white [&>option]:text-slate-900 [&>option]:text-center [&>option]:py-2 [&>option]:text-[11px] [&>option]:font-medium [&>option]:uppercase`}
            >
              <option value="NOT_RUN">NOT STARTED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
              <option value="BLOCK">BLOCKED</option>
            </select>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Precondition */}
          {planItem.testCase.precondition && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <CheckCircle2 size={14} className="inline mr-1" />
                Precondition
              </label>
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 border border-slate-200">
                <p className="whitespace-pre-wrap">{planItem.testCase.precondition}</p>
              </div>
            </div>
          )}

          {/* Steps */}
          {steps.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <ListChecks size={14} className="inline mr-1" />
                Steps ({steps.length})
              </label>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-3 items-start bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-sm text-slate-700 flex-1 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected Result */}
          {planItem.testCase.expectedResult && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Expected Result
              </label>
              <div className="bg-emerald-50 rounded-lg p-4 text-sm text-emerald-900 border border-emerald-200">
                <p className="whitespace-pre-wrap">{planItem.testCase.expectedResult}</p>
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Comment
            </label>
            <textarea
              value={localComment}
              onChange={(e) => setLocalComment(e.target.value)}
              onBlur={handleCommentSave}
              placeholder="Add notes, observations, or links..."
              className="w-full min-h-[120px] px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              Auto-saved on blur. URLs will be clickable in the table.
            </p>
          </div>

          {/* Metadata */}
          <div className="border-t border-slate-200 pt-4 space-y-2 text-xs text-slate-500">
            {planItem.executedAt && (
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Last executed: {new Date(planItem.executedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

