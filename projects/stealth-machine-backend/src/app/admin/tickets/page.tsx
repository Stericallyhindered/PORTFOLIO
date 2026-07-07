'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, Search, X, Clock, AlertCircle, CheckCircle, 
  User, MessageSquare, ChevronRight 
} from 'lucide-react';

interface TicketUser {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
}

interface TicketData {
  id: string;
  ticketNumber: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  category: string;
  createdAt: string;
  updatedAt: string;
  user: TicketUser;
  assignedTo?: TicketUser;
  machine?: {
    id: string;
    model: string;
    serialNumber: string;
  };
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [search, statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      params.set('limit', '100');
      
      const response = await fetch(`/api/tickets?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTickets(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-700';
      case 'WAITING_ON_CUSTOMER': return 'bg-yellow-100 text-yellow-700';
      case 'RESOLVED': return 'bg-green-100 text-green-700';
      case 'CLOSED': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />;
      case 'RESOLVED': case 'CLOSED': return <CheckCircle className="h-4 w-4" />;
      default: return <Ticket className="h-4 w-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Count tickets by status
  const statusCounts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500">Manage customer support requests</p>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { status: 'OPEN', label: 'Open', color: 'text-blue-600', bg: 'bg-blue-50' },
          { status: 'IN_PROGRESS', label: 'In Progress', color: 'text-purple-600', bg: 'bg-purple-50' },
          { status: 'WAITING_ON_CUSTOMER', label: 'Waiting', color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { status: 'RESOLVED', label: 'Resolved', color: 'text-green-600', bg: 'bg-green-50' },
          { status: 'CLOSED', label: 'Closed', color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map(({ status, label, color, bg }) => (
          <Card 
            key={status} 
            className={`cursor-pointer transition-all ${statusFilter === status ? 'ring-2 ring-smt-red' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
          >
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${color}`}>
                {statusCounts[status] || 0}
              </div>
              <div className="text-sm text-gray-500">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            {(statusFilter || priorityFilter || search) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => { setStatusFilter(''); setPriorityFilter(''); setSearch(''); }}
              >
                Clear Filters
              </Button>
            )}
            <div className="text-sm text-gray-500 ml-auto">
              {tickets.length} tickets
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tickets found</p>
                <p className="text-sm mt-1">Tickets from customers will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedTicket?.id === ticket.id 
                        ? 'border-smt-red bg-red-50/50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-500">
                            {ticket.ticketNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 truncate">
                          {ticket.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ticket.user.firstName} {ticket.user.lastName}
                            {ticket.user.company && ` (${ticket.user.company})`}
                          </span>
                          <span>{formatDate(ticket.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {formatStatus(ticket.status)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Detail Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5" />
              Ticket Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTicket ? (
              <div className="space-y-4">
                <div>
                  <span className="font-mono text-sm text-gray-500">
                    {selectedTicket.ticketNumber}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-1">
                    {selectedTicket.title}
                  </h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {getStatusIcon(selectedTicket.status)}
                    {formatStatus(selectedTicket.status)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {selectedTicket.category}
                  </Badge>
                </div>

                {selectedTicket.description && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Description</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>
                  </div>
                )}
                
                <div className="pt-3 border-t space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Customer</h4>
                    <p className="text-sm">
                      {selectedTicket.user.firstName} {selectedTicket.user.lastName}
                    </p>
                    {selectedTicket.user.company && (
                      <p className="text-xs text-gray-500">{selectedTicket.user.company}</p>
                    )}
                  </div>
                  
                  {selectedTicket.machine && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Machine</h4>
                      <p className="text-sm">{selectedTicket.machine.model}</p>
                      <p className="text-xs text-gray-500">S/N: {selectedTicket.machine.serialNumber}</p>
                    </div>
                  )}
                  
                  {selectedTicket.assignedTo && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Assigned To</h4>
                      <p className="text-sm">
                        {selectedTicket.assignedTo.firstName} {selectedTicket.assignedTo.lastName}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Created</h4>
                    <p className="text-sm">{formatDate(selectedTicket.createdAt)}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Last Updated</h4>
                    <p className="text-sm">{formatDate(selectedTicket.updatedAt)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Select a ticket to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
