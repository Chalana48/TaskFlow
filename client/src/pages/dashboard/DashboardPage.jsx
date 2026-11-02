import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import dashboardService from '../../services/dashboardService';
import { projectService } from '../../services/projectService';
import StatCard from '../../components/dashboard/StatCard';
import TaskStatusChart from '../../components/dashboard/TaskStatusChart';
import ProjectStatusChart from '../../components/dashboard/ProjectStatusChart';
import TaskPriorityChart from '../../components/dashboard/TaskPriorityChart';
import CompletionTrendChart from '../../components/dashboard/CompletionTrendChart';
import UpcomingDeadlines from '../../components/dashboard/UpcomingDeadlines';
import RecentActivity from '../../components/dashboard/RecentActivity';
import MyTasksWidget from '../../components/dashboard/MyTasksWidget';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Sparkles,
  Plus,
  RefreshCw,
  Filter,
  AlertTriangle,
  UserCheck,
  CalendarCheck,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();

  // Project filtering state
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Overview metrics state
  const [overview, setOverview] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    inReviewTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    myTasks: 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);

  // Status & Priority charts state
  const [projectStats, setProjectStats] = useState({});
  const [projectStatsLoading, setProjectStatsLoading] = useState(true);
  const [projectStatsError, setProjectStatsError] = useState(null);

  const [taskStats, setTaskStats] = useState({ status: {}, priority: {} });
  const [taskStatsLoading, setTaskStatsLoading] = useState(true);
  const [taskStatsError, setTaskStatsError] = useState(null);

  // Completion trends state
  const [trendPeriod, setTrendPeriod] = useState('weekly');
  const [trends, setTrends] = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState(null);

  // Deadlines, activity, and my tasks state
  const [deadlines, setDeadlines] = useState([]);
  const [deadlinesLoading, setDeadlinesLoading] = useState(true);
  const [deadlinesError, setDeadlinesError] = useState(null);

  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  const [myTasks, setMyTasks] = useState([]);
  const [myTasksLoading, setMyTasksLoading] = useState(true);
  const [myTasksError, setMyTasksError] = useState(null);

  // Load project dropdown options once
  useEffect(() => {
    let isMounted = true;
    projectService
      .getProjects({ limit: 100 })
      .then((res) => {
        if (isMounted) {
          const list = res.data?.projects || res.data || [];
          setProjectsList(Array.isArray(list) ? list : []);
        }
      })
      .catch((err) => {
        console.warn('Unable to load projects list for filter:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (projectId) => {
    // 1. Overview
    setOverviewLoading(true);
    setOverviewError(null);
    dashboardService
      .getOverview(projectId)
      .then((res) => setOverview(res.data || {}))
      .catch((err) => setOverviewError(err.message || 'Failed to load overview'))
      .finally(() => setOverviewLoading(false));

    // 2. Project Statistics
    setProjectStatsLoading(true);
    setProjectStatsError(null);
    dashboardService
      .getProjectStatistics(projectId)
      .then((res) => setProjectStats(res.data || {}))
      .catch((err) => setProjectStatsError(err.message || 'Failed to load project stats'))
      .finally(() => setProjectStatsLoading(false));

    // 3. Task Statistics
    setTaskStatsLoading(true);
    setTaskStatsError(null);
    dashboardService
      .getTaskStatistics(projectId)
      .then((res) => setTaskStats(res.data || { status: {}, priority: {} }))
      .catch((err) => setTaskStatsError(err.message || 'Failed to load task stats'))
      .finally(() => setTaskStatsLoading(false));

    // 4. Upcoming Deadlines
    setDeadlinesLoading(true);
    setDeadlinesError(null);
    dashboardService
      .getUpcomingDeadlines(6, projectId)
      .then((res) => setDeadlines(res.data || []))
      .catch((err) => setDeadlinesError(err.message || 'Failed to load deadlines'))
      .finally(() => setDeadlinesLoading(false));

    // 5. Recent Activity
    setActivitiesLoading(true);
    setActivitiesError(null);
    dashboardService
      .getRecentActivity(10, projectId)
      .then((res) => setActivities(res.data || []))
      .catch((err) => setActivitiesError(err.message || 'Failed to load activities'))
      .finally(() => setActivitiesLoading(false));

    // 6. My Active Tasks
    setMyTasksLoading(true);
    setMyTasksError(null);
    dashboardService
      .getMyTasks(5, projectId)
      .then((res) => setMyTasks(res.data || []))
      .catch((err) => setMyTasksError(err.message || 'Failed to load assigned tasks'))
      .finally(() => setMyTasksLoading(false));
  }, []);

  // Fetch completion trend independently when period or projectId changes
  const fetchTrends = useCallback(async (period, projectId) => {
    setTrendsLoading(true);
    setTrendsError(null);
    dashboardService
      .getTrends(period, projectId)
      .then((res) => setTrends(res.data || []))
      .catch((err) => setTrendsError(err.message || 'Failed to load trends'))
      .finally(() => setTrendsLoading(false));
  }, []);

  // Trigger main data load when selected project changes
  useEffect(() => {
    fetchDashboardData(selectedProjectId);
  }, [fetchDashboardData, selectedProjectId]);

  // Trigger trend reload when trend period changes
  useEffect(() => {
    fetchTrends(trendPeriod, selectedProjectId);
  }, [fetchTrends, trendPeriod, selectedProjectId]);

  const handlePeriodChange = (newPeriod) => {
    setTrendPeriod(newPeriod);
  };

  const handleRefresh = () => {
    fetchDashboardData(selectedProjectId);
    fetchTrends(trendPeriod, selectedProjectId);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Live Analytics & Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time project velocity, task progress, and team activity for your workspace.
          </p>
        </div>

        {/* Action Controls & Project Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <select
              id="dashboard-project-filter"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer appearance-none"
            >
              <option value="">All Accessible Projects</option>
              {projectsList.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh dashboard metrics"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/tasks"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" /> New Task
          </Link>
        </div>
      </div>

      {/* Error banner if overview completely fails */}
      {overviewError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{overviewError}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg font-semibold transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Row 1: KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Projects"
          value={overview.totalProjects}
          icon={FolderKanban}
          description="In portfolio"
          colorScheme="purple"
          loading={overviewLoading}
        />
        <StatCard
          title="Active Projects"
          value={overview.activeProjects}
          icon={CalendarCheck}
          description="In progress"
          colorScheme="sky"
          loading={overviewLoading}
        />
        <StatCard
          title="Total Tasks"
          value={overview.totalTasks}
          icon={CheckSquare}
          description="Created across boards"
          colorScheme="indigo"
          loading={overviewLoading}
        />
        <StatCard
          title="Completed Tasks"
          value={overview.completedTasks}
          icon={CalendarCheck}
          description="Marked as DONE"
          colorScheme="emerald"
          loading={overviewLoading}
        />
        <StatCard
          title="Overdue Tasks"
          value={overview.overdueTasks}
          icon={Clock}
          description="Past due deadline"
          trend={overview.overdueTasks > 0 ? 'Action Needed' : 'On Track'}
          trendPositive={overview.overdueTasks === 0}
          colorScheme="rose"
          loading={overviewLoading}
        />
        <StatCard
          title="My Tasks"
          value={overview.myTasks}
          icon={UserCheck}
          description="Assigned to you"
          colorScheme="amber"
          loading={overviewLoading}
        />
      </div>

      {/* Row 2: Analytics Visualizations (Task Status + Project Pipeline + Priority Distribution) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TaskStatusChart
          data={taskStats.status}
          loading={taskStatsLoading}
          error={taskStatsError}
        />
        <ProjectStatusChart
          data={projectStats}
          loading={projectStatsLoading}
          error={projectStatsError}
        />
        <TaskPriorityChart
          data={taskStats.priority}
          loading={taskStatsLoading}
          error={taskStatsError}
        />
      </div>

      {/* Row 3: Task Completion Velocity Trend Line Chart */}
      <div>
        <CompletionTrendChart
          data={trends}
          period={trendPeriod}
          onPeriodChange={handlePeriodChange}
          loading={trendsLoading}
          error={trendsError}
        />
      </div>

      {/* Row 4: Operational Widgets (Upcoming Deadlines, My Tasks, Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UpcomingDeadlines
          tasks={deadlines}
          loading={deadlinesLoading}
          error={deadlinesError}
        />
        <MyTasksWidget
          tasks={myTasks}
          loading={myTasksLoading}
          error={myTasksError}
        />
        <RecentActivity
          activities={activities}
          loading={activitiesLoading}
          error={activitiesError}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
