import React from 'react';
import { getStatusBadge, getPriorityBadge } from '../utils/formatters';

export default function StatusBadge({ status, priority, label, className = '' }) {
  if (priority) {
    const config = getPriorityBadge(priority);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.bg} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`} />
        {label || config.label}
      </span>
    );
  }

  const config = getStatusBadge(status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`} />
      {label || config.label}
    </span>
  );
}
