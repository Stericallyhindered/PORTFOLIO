'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MoreHorizontal, Eye } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  status: 'In Progress' | 'Completed' | 'Under Review' | 'Draft';
  lastUpdated: string;
  type: 'Product Review' | 'Brand Video' | 'Contest Entry' | 'Commercial';
  progress: number;
}

export const RecentProjects = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/dashboard/recent-submissions');
        const data = await response.json();
        if (data.success) {
          setProjects(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch recent projects:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-500';
      case 'Completed': return 'bg-green-500';
      case 'Under Review': return 'bg-yellow-500';
      case 'Draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Recent Projects</CardTitle>
        <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-gray-400 text-center py-4">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-gray-400 text-center py-4">No recent projects</div>
        ) : (
          projects.map((project) => (
          <div key={project.id} className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="font-medium text-white">{project.title}</h3>
                <Badge className={`${getStatusColor(project.status)} text-white text-xs`}>
                  {project.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>{project.type}</span>
                <div className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>{project.lastUpdated}</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{project.progress}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Eye size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreHorizontal size={16} />
              </Button>
            </div>
          </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}; 