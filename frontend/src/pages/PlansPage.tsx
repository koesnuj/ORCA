import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlans, Plan } from '../api/plan';
import { Plus, PlayCircle, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const response = await getPlans('ACTIVE');
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('Failed to load plans', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 w-full mx-auto max-w-[1800px]">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test Plans & Runs</h1>
          <p className="text-slate-500 mt-1">Manage your test execution cycles.</p>
        </div>
        <Button
          onClick={() => navigate('/plans/create')}
          icon={<Plus size={16} />}
        >
          Add Test Plan
        </Button>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-slate-500">Loading...</div>
      ) : plans.length === 0 ? (
        <Card className="p-12 text-center">
          <PlayCircle size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900">No active test plans</h3>
          <p className="text-slate-500 mt-2">Create a test plan to start executing test cases.</p>
          <div className="mt-6">
            <Button 
              onClick={() => navigate('/plans/create')}
              icon={<Plus size={16} />}
            >
              Create Plan
            </Button>
          </div>
        </Card>
      ) : (
        <Card noPadding>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-2/5">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stats</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {plans.map((plan) => (
                <tr 
                  key={plan.id} 
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/plans/${plan.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <FileText className="text-indigo-600 mt-0.5 mr-3 flex-shrink-0 h-5 w-5" />
                      <div>
                        <div className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 mb-1">
                          {plan.name}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1">
                          {plan.description || 'No description provided.'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="w-full max-w-xs">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">{plan.stats?.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            (plan.stats?.progress || 0) === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${plan.stats?.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1" title="Passed">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="font-medium">{plan.stats?.pass}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Failed">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <span className="font-medium">{plan.stats?.fail}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Untested">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <span className="font-medium">{plan.stats?.notRun}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex flex-col">
                      <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs text-slate-400">by {plan.createdBy}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default PlansPage;
