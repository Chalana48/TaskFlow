import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Kanban,
  BarChart2,
  Zap,
  Sparkles,
} from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Public Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-2"
              >
                <span>Go to Dashboard ({user?.name?.split(' ')[0]})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 font-semibold text-xs transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-6 max-w-7xl mx-auto text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Enterprise SaaS Project Management
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Manage Projects &amp; Teams with{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-200 bg-clip-text text-transparent">
                Unmatched Precision
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-8">
              TaskFlow brings together modern Kanban drag-and-drop boards, role-based team management, real-time analytics, and secure JWT authentication in one sleek platform.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center gap-2"
              >
                <span>Start Free Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-800 transition"
              >
                Explore Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Engineered for Real-World Engineering Teams
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Everything required to plan sprints, track deliverables, collaborate on tasks, and delegate with Role-Based Access Control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Kanban className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Interactive Kanban Board</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Smooth drag-and-drop task workflows with immediate optimistic UI updates and backend synchronization across TODO, In Progress, Review, and Completed columns.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Role-Based Access Control</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Granular permissions distinguish regular Users, Project Managers, and System Administrators with backend middleware security and customized views.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Metrics &amp; Visual Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interactive Recharts charts illustrating task priority distribution, weekly velocity, overdue deadlines, and overall project health.
              </p>
            </div>
          </div>
        </section>

        {/* Statistics Bar */}
        <section className="py-12 px-6 border-t border-b border-slate-800/80 bg-slate-900/30">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-extrabold text-white mb-1">100%</div>
              <div className="text-xs text-slate-400 font-medium">MERN Pure JavaScript</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-indigo-400 mb-1">3 Roles</div>
              <div className="text-xs text-slate-400 font-medium">User • PM • Admin</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-cyan-400 mb-1">15 Tests</div>
              <div className="text-xs text-slate-400 font-medium">Jest &amp; Supertest Automated</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-400 mb-1">REST API</div>
              <div className="text-xs text-slate-400 font-medium">JWT &amp; Cookie Secured</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        TaskFlow – Smart Project &amp; Team Management Platform • Senior Full-Stack MERN Architecture
      </footer>
    </div>
  );
};

export default LandingPage;
