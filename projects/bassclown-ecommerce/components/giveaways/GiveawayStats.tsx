import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Crown, Users, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { GiveawayStats as GiveawayStatsType } from '@/lib/types';

interface GiveawayStatsProps {
  stats: GiveawayStatsType;
  variant?: 'default' | 'compact';
  className?: string;
}

export function GiveawayStats({ stats, variant = 'default', className }: GiveawayStatsProps) {
  const statCards = [
    {
      title: 'Total Giveaways',
      value: stats.totalGiveaways.toString(),
      icon: Gift,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Prizes Given',
      value: `$${stats.totalPrizeValue.toLocaleString()}`,
      icon: Trophy,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Your Entries',
      value: stats.userEntries.toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Your Wins',
      value: stats.userWins.toString(),
      icon: Crown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Win Rate',
      value: `${stats.userWinRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Total Entries',
      value: stats.totalEntries.toLocaleString(),
      icon: Calendar,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
        {statCards.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className={`w-8 h-8 rounded-full ${stat.bgColor} flex items-center justify-center mx-auto`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className={`text-lg font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600">
                  {stat.title}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            
            {/* Add some contextual info for certain stats */}
            {stat.title === 'Win Rate' && stats.userEntries > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {stats.userWins} of {stats.userEntries} entries
                </Badge>
              </div>
            )}
            
            {stat.title === 'Your Wins' && stats.userWins > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <Badge variant="default" className="text-xs bg-yellow-500">
                  <Crown className="w-3 h-3 mr-1" />
                  Winner!
                </Badge>
              </div>
            )}
            
            {stat.title === 'Total Entries' && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  Across all giveaways
                </p>
              </div>
            )}
            
            {stat.title === 'Prizes Given' && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  Total value distributed
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Helper component for individual stat items
export function StatItem({ 
  title, 
  value, 
  icon: Icon, 
  color = 'text-blue-600',
  bgColor = 'bg-blue-50',
  subtitle 
}: {
  title: string;
  value: string;
  icon: any;
  color?: string;
  bgColor?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-white">
      <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className="flex-1">
        <div className={`text-2xl font-bold ${color}`}>
          {value}
        </div>
        <div className="text-sm text-gray-600">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-1">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
} 