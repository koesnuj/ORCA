import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPlan } from '../api/plan';
import { getTestCases, TestCase } from '../api/testcase';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

const CreatePlanPage: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<TestCase[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTestCases();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCases(testCases);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCases(testCases.filter(tc => 
        tc.title.toLowerCase().includes(query) || 
        (tc.precondition && tc.precondition.toLowerCase().includes(query))
      ));
    }
  }, [searchQuery, testCases]);

  const loadTestCases = async () => {
    try {
      const response = await getTestCases();
      if (response.success) {
        setTestCases(response.data);
        setFilteredCases(response.data);
      }
    } catch (error) {
      console.error('Failed to load test cases', error);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredCases.length) {
      setSelectedIds(new Set());
    } else {
      const newSelected = new Set(selectedIds);
      filteredCases.forEach(tc => newSelected.add(tc.id));
      setSelectedIds(newSelected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('플랜 이름을 입력해주세요.');
      return;
    }
    if (selectedIds.size === 0) {
      alert('최소 하나 이상의 테스트케이스를 선택해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await createPlan({
        name,
        description,
        testCaseIds: Array.from(selectedIds)
      });
      if (response.success) {
        navigate('/plans');
      }
    } catch (error) {
      alert('플랜 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 w-full mx-auto max-w-[1600px]">
      <div className="mb-6">
        <button 
          onClick={() => navigate('/plans')}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" /> Back to Plans
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Create New Test Plan</h1>
        <p className="text-slate-500 mt-1">Select test cases and configure execution details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card title="Basic Information">
          <div className="space-y-4">
            <Input
              label="Plan Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 2024 Q1 Release Testing"
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows={3}
                placeholder="Enter test plan description..."
              />
            </div>
          </div>
        </Card>

        {/* Test Case Selection */}
        <Card 
          title={`Select Test Cases (${selectedIds.size} selected)`}
          action={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title..."
                className="pl-10 pr-4 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          }
          noPadding
        >
          <div className="border-b border-slate-200">
            <div className="bg-slate-50 px-6 py-3 flex items-center">
              <input
                type="checkbox"
                checked={filteredCases.length > 0 && selectedIds.size === filteredCases.length}
                onChange={handleSelectAll}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-3 h-4 w-4"
              />
              <span className="text-sm font-semibold text-slate-700">Select All</span>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {filteredCases.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No test cases found.</div>
            ) : (
              filteredCases.map((tc) => (
                <div 
                  key={tc.id} 
                  className={`px-6 py-3 flex items-center hover:bg-slate-50 cursor-pointer transition-colors ${
                    selectedIds.has(tc.id) ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => handleToggleSelect(tc.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(tc.id)}
                    onChange={() => {}}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-4 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        tc.priority === 'HIGH' ? 'error' : 
                        tc.priority === 'MEDIUM' ? 'warning' : 'success'
                      }>
                        {tc.priority}
                      </Badge>
                      <span className="text-sm font-medium text-slate-900">{tc.title}</span>
                    </div>
                    {tc.precondition && (
                      <p className="text-xs text-slate-500 mt-1 ml-16 truncate">{tc.precondition}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/plans')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || selectedIds.size === 0}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePlanPage;
