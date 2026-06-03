export default function PlanBadge({ planName = 'Gratuito', size = 'sm' }) {
  const colors = {
    'Gratuito': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'Básico': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Intermedio': 'bg-sf-accent/20 text-sf-accent border-sf-accent/30',
    'Premium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-md border ${
      colors[planName] || colors['Gratuito']
    } ${sizeClasses[size]}`}>
      {planName}
    </span>
  );
}
