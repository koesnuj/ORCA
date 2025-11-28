import React, { useState, useEffect } from 'react';
import { X, User, AlertCircle, CheckCircle2, ListChecks } from 'lucide-react';
import { PlanItem, TestResult } from '../api/plan';
import { User as UserType } from '../api/types';
import { Badge } from './ui/Badge';

interface TestCaseDetailColumnProps {
  planItem: PlanItem | null;
  users: UserType[];
  onClose: () => void;
  onUpdate: (itemId: string, updates: { result?: TestResult; assignee?: string; comment?: string }) => void;
}

/**
 * TestCaseDetailColumn - 우측 디테일 컬럼
 * 슬라이드가 아닌 "새로운 컬럼"으로 나타나는 방식
 * 선택된 테스트 케이스의 상세 정보 표시 및 수정
 */
export const TestCaseDetailColumn: React.FC<TestCaseDetailColumnProps> = ({
  planItem,
  users,
  onClose,
  onUpdate,
}) => {
  const [localResult, setLocalResult] = useState<TestResult>('NOT_RUN');
  const [localAssignee, setLocalAssignee] = useState<string>('');
  const [localComment, setLocalComment] = useState<string>('');

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
      if (e.key === 'Escape' && planItem) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [planItem, onClose]);

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

  if (!planItem) return null;

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
    <div className="w-[420px] h-full bg-white border-l border-slate-200 flex-shrink-0 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Test Case Details</h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          title="Close (ESC)"
        >
          <X size={18} className="text-slate-500" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* ID & Priority */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
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
          <h2 className="text-base font-bold text-slate-900 leading-snug">
            {planItem.testCase.title}
          </h2>
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <User size={13} className="inline mr-1" />
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
            <AlertCircle size={13} className="inline mr-1" />
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
              <CheckCircle2 size={13} className="inline mr-1" />
              Precondition
            </label>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 border border-slate-200">
              <p className="whitespace-pre-wrap leading-relaxed">{planItem.testCase.precondition}</p>
            </div>
          </div>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <ListChecks size={13} className="inline mr-1" />
              Steps ({steps.length})
            </label>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2 items-start bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-xs text-slate-700 flex-1 leading-relaxed">{step}</p>
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
            <div className="bg-emerald-50 rounded-lg p-3 text-sm text-emerald-900 border border-emerald-200">
              <p className="whitespace-pre-wrap leading-relaxed">{planItem.testCase.expectedResult}</p>
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
            className="w-full min-h-[100px] px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Auto-saved on blur
          </p>
        </div>

        {/* Metadata */}
        {planItem.executedAt && (
          <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-400">
            Last executed: {new Date(planItem.executedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

