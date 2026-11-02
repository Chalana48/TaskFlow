import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import StatCard from '../../components/dashboard/StatCard';
import {
  Users,
  UserCheck,
  UserX,
  FolderKanban,
  CheckSquare,
  Clock,
  AlertTriangle,
  RefreshCw,
  Shield,
  ArrowRight,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const AdminDashboardPage = () => {
  const [overview, setOverview] = useState(null);
  const [growthData, setGrowthData] = useState([]);
  const [projectStats, setProjectStats] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [growthDays, setGrowthDays] = useState(30);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [ovRes, grRes, prRes, tkRes] = await Promise.all([
        adminService.getOverview(),
        adminService.getUserGrowth(growthDays),
        adminService.getProjectStats(),
        adminService.getTaskStats(),
      ]);

      setOverview(ovRes.data);
      setGrowthData(grRes.data || []);
      setProjectStats(prRes.data);
      setTaskStats(tkRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load admin dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [growthDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Chart data formatters
  const projectChartData = projectStats?.byStatus
    ? Object.entries(projectStats.byStatus).map(([status, count]) => ({
        status,
        count,
      }))
    : [];

  const taskChartData = taskStats?.byStatus
    ? Object.entries(taskStats.byStatus).map(([status, count]) => ({
        status,
        count,
      }))
    : [];

  const STATUS_COLORS = {
    PLANNING: '#6366f1',
    ACTIVE: '#10b981',
    ON_HOLD: '#f59e0b',
    COMPLETED: '#3b82f6',
    CANCELLED: '#ef4444',
    TODO: '#94a3b8',
    IN_PROGRESS: '#06b6d4',
    IN_REVIEW: '#8b5cf6',
    DONE: '#10b981',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-widest">
              Executive Level
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-400" /> Administrative Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time platform metrics, aggregated database insights, and system controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition"
          >
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 bg-rose-500/20 rounded text-rose-300 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Users"
          value={overview?.users?.total ?? 0}
          icon={Users}
          description={`${overview?.users?.active ?? 0} active accounts`}
          colorScheme="purple"
          loading={loading}
        />
        <StatCard
          title="Active Projects"
          value={overview?.projects?.active ?? 0}
          icon={FolderKanban}
          description={`Out of ${overview?.projects?.total ?? 0} total`}
          colorScheme="indigo"
          loading={loading}
        />
        <StatCard
          title="Completed Tasks"
          value={overview?.tasks?.completed ?? 0}
          icon={CheckSquare}
          description={`Out of ${overview?.tasks?.total ?? 0} total`}
          colorScheme="emerald"
          loading={loading}
        />
        <StatCard
          title="Overdue Tasks"
          value={overview?.tasks?.overdue ?? 0}
          icon={AlertTriangle}
          description={`${overview?.users?.suspended ?? 0} accounts suspended`}
          colorScheme="rose"
          loading={loading}
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active Users
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {overview?.users?.active ?? 0}
            </div>
          </div>
          <UserCheck className="w-5 h-5 text-emerald-400/60" />
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Suspended Users
            </div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">
              {overview?.users?.suspended ?? 0}
            </div>
          </div>
          <UserX className="w-5 h-5 text-rose-400/60" />
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Projects
            </div>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">
              {overview?.projects?.total ?? 0}
            </div>
          </div>
          <FolderKanban className="w-5 h-5 text-indigo-400/60" />
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Tasks
            </div>
            <div className="text-xl font-bold text-purple-400 mt-0.5">
              {overview?.tasks?.total ?? 0}
            </div>
          </div>
          <CheckSquare className="w-5 h-5 text-purple-400/60" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Area Chart (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" /> User Registration Velocity
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daily new account onboarding trend over time
              </p>
            </div>

            {/* Time Filter */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setGrowthDays(d)}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    growthDays === d
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Loading registration growth chart...
              </div>
            ) : growthData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No user registrations recorded in this timeframe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(val) => {
                      const parts = val.split('-');
                      return `${parts[1]}/${parts[2]}`;
                    }}
                  />
                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    name="New Registrations"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#growthGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Project Status Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-400" /> Project Status Distribution
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Projects partitioned by workflow state</p>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Loading project status chart...
              </div>
            ) : projectChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No projects found in database.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="status"
                    stroke="#64748b"
                    fontSize={10}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="count" name="Projects" radius={[0, 6, 6, 0]}>
                    {projectChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Task Status Distribution Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-cyan-400" /> System-Wide Task Progression
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time status breakdown across all enterprise projects
          </p>
        </div>

        <div className="h-56 sm:h-64 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Loading task status chart...
            </div>
          ) : taskChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No tasks found in database.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="status" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" name="Tasks" radius={[6, 6, 0, 0]}>
                  {taskChartData.map((entry, index) => (
                    <Cell
                      key={`task-cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || '#06b6d4'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
