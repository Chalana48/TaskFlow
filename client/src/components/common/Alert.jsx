import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const Alert = ({ type = 'info', message, onClose, className = '' }) => {
  if (!message) return null;

  const styles = {
    error: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    },
    info: {
      bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
      icon: <Info className="w-4 h-4 text-indigo-400 shrink-0" />,
    },
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div
      className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs leading-relaxed ${currentStyle.bg} ${className}`}
    >
      <div className="mt-0.5">{currentStyle.icon}</div>
      <div className="flex-1 font-medium">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition ml-2 p-0.5"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default Alert;
