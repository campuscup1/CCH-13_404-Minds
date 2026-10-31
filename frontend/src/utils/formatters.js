/**
 * Formatting and styling helpers
 */

export function formatDate(isoString) {
  if (!isoString) return '--';
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTimeAgo(isoString) {
  if (!isoString) return '--';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function getPriorityBadge(priority) {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return {
        bg: 'bg-red-100 text-red-800 border-red-300',
        dot: 'bg-red-600',
        label: 'Critical'
      };
    case 'high':
      return {
        bg: 'bg-orange-100 text-orange-800 border-orange-300',
        dot: 'bg-orange-500',
        label: 'High'
      };
    case 'medium':
      return {
        bg: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        dot: 'bg-yellow-500',
        label: 'Medium'
      };
    case 'low':
      return {
        bg: 'bg-blue-100 text-blue-800 border-blue-300',
        dot: 'bg-blue-400',
        label: 'Low'
      };
    default:
      return {
        bg: 'bg-slate-100 text-slate-800 border-slate-300',
        dot: 'bg-slate-500',
        label: priority || 'Normal'
      };
  }
}

export function getStatusBadge(status) {
  const norm = (status || '').toLowerCase().replace(/_/g, ' ');

  if (norm.includes('available')) {
    return {
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500',
      label: 'Available'
    };
  }
  if (norm.includes('dispatched') || norm.includes('assigned')) {
    return {
      bg: 'bg-blue-100 text-blue-800 border-blue-300',
      dot: 'bg-blue-600',
      label: 'Dispatched'
    };
  }
  if (norm.includes('en route') || norm.includes('on the way')) {
    return {
      bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      dot: 'bg-indigo-500',
      label: 'En Route'
    };
  }
  if (norm.includes('scene') || norm.includes('arrived at scene')) {
    return {
      bg: 'bg-amber-100 text-amber-800 border-amber-300',
      dot: 'bg-amber-500',
      label: 'On Scene'
    };
  }
  if (norm.includes('pickup') || norm.includes('picked up')) {
    return {
      bg: 'bg-purple-100 text-purple-800 border-purple-300',
      dot: 'bg-purple-600',
      label: 'Pickup Confirmed'
    };
  }
  if (norm.includes('hospital') || norm.includes('transporting')) {
    return {
      bg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      dot: 'bg-cyan-600',
      label: 'To Hospital'
    };
  }
  if (norm.includes('completed')) {
    return {
      bg: 'bg-teal-100 text-teal-800 border-teal-300',
      dot: 'bg-teal-600',
      label: 'Completed'
    };
  }

  return {
    bg: 'bg-rose-100 text-rose-800 border-rose-300',
    dot: 'bg-rose-500',
    label: status || 'Pending'
  };
}
