import React from 'react';
import { BarChart3, Clock, Zap, Eye } from 'lucide-react';

interface StatsProps {
  totalGestures: number;
  sessionTime: number;
  averageConfidence: number;
  handsDetected: number;
}

const Stats: React.FC<StatsProps> = ({
  totalGestures,
  sessionTime,
  averageConfidence,
  handsDetected
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = [
    {
      icon: BarChart3,
      label: 'Total Gestures',
      value: totalGestures.toString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Clock,
      label: 'Session Time',
      value: formatTime(sessionTime),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Zap,
      label: 'Avg. Confidence',
      value: `${(averageConfidence * 100).toFixed(1)}%`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Eye,
      label: 'Hands Detected',
      value: handsDetected.toString(),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Session Statistics</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-lg p-4 border border-opacity-20`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-white ${stat.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className={`text-lg font-semibold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stats;