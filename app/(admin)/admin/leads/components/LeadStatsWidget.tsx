import { LeadStats } from "@/lib/actions/leads";

interface LeadStatsWidgetProps {
  stats: LeadStats;
}

export function LeadStatsWidget({ stats }: LeadStatsWidgetProps) {
  const statCards = [
    {
      label: "Всего заявок",
      value: stats.total,
      color: "bg-gray-100 text-gray-800",
    },
    {
      label: "Новые",
      value: stats.new,
      color: "bg-green-100 text-green-800",
    },
    {
      label: "Приняты",
      value: stats.accepted,
      color: "bg-blue-100 text-blue-800",
    },
    {
      label: "Завершены",
      value: stats.completed,
      color: "bg-purple-100 text-purple-800",
    },
    {
      label: "Подозрительные",
      value: stats.suspicious,
      color: "bg-red-100 text-red-800",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.color} rounded-lg p-4 text-center`}
        >
          <div className="text-2xl font-bold">{stat.value}</div>
          <div className="text-sm opacity-80">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}