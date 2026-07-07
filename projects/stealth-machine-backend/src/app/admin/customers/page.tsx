'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  Package,
  MessageSquare,
  ChevronRight,
  Download,
  Mail,
  Phone,
  Building2,
  Calendar,
} from 'lucide-react';

interface Machine {
  id: string;
  model: string;
  serialNumber: string;
  status: string;
}

interface CustomerData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  createdAt: string;
  lastLoginAt?: string;
  machines: Machine[];
  _count: { machines: number; tickets: number };
}

interface ChatSessionSummary {
  id: string;
  sessionId: string;
  customerName?: string;
  customerEmail?: string;
  machineModel?: string;
  serialNumber?: string;
  createdAt: string;
  _count: { messages: number };
}

interface ChatMessageRow {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number }>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [machineModelFilter, setMachineModelFilter] = useState('');
  const [hasMachineOnly, setHasMachineOnly] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageRow[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (searchDebounced) params.set('search', searchDebounced);
      if (machineModelFilter) params.set('machineModel', machineModelFilter);
      if (hasMachineOnly) params.set('hasMachine', 'true');

      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCustomers(data.data);
        if (data.pagination) {
          setPagination({
            page: data.pagination.page,
            limit: data.pagination.limit,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages ?? Math.ceil((data.pagination.total || 0) / (data.pagination.limit || 20)),
          });
        }
      }
    } catch (e) {
      console.error('Fetch customers error:', e);
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, machineModelFilter, hasMachineOnly]);

  // Fetch when filters change (reset to page 1) or on mount
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
    fetchCustomers(1);
  }, [searchDebounced, machineModelFilter, hasMachineOnly]);

  // When user clicks prev/next, fetchCustomers is called from handlePageChange with the new page

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchCustomers(newPage);
      setPagination((p) => ({ ...p, page: newPage }));
    }
  };

  // When a customer is selected, fetch their chat sessions
  useEffect(() => {
    if (!selectedCustomer?.id) {
      setSessions([]);
      setSelectedSessionId(null);
      setChatMessages([]);
      return;
    }
    setSessionsLoading(true);
    setSelectedSessionId(null);
    setChatMessages([]);
    fetch(`/api/chat-sessions?customerId=${selectedCustomer.id}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setSessions(data.data);
        else setSessions([]);
      })
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, [selectedCustomer?.id]);

  // When a session is selected, fetch messages
  useEffect(() => {
    if (!selectedSessionId) {
      setChatMessages([]);
      return;
    }
    setMessagesLoading(true);
    fetch(`/api/ai/chat?sessionId=${selectedSessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setChatMessages(data.data);
        else setChatMessages([]);
      })
      .catch(() => setChatMessages([]))
      .finally(() => setMessagesLoading(false));
  }, [selectedSessionId]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Machines', 'Registered'];
    const rows = customers.map((c) => [
      `${c.firstName} ${c.lastName}`.trim(),
      c.email,
      c.phone ?? '',
      c.company ?? '',
      c.machines.map((m) => `${m.model} (${m.serialNumber})`).join('; '),
      formatDate(c.createdAt),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">View customer list, chat history, and registered machines</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={loading || customers.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, company, phone..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Input
              placeholder="Machine model (e.g. SL-4020)"
              className="max-w-[180px]"
              value={machineModelFilter}
              onChange={(e) => setMachineModelFilter(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={hasMachineOnly}
                onChange={(e) => setHasMachineOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              With registered machine only
            </label>
            {(search || machineModelFilter || hasMachineOnly) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setMachineModelFilter('');
                  setHasMachineOnly(false);
                }}
              >
                Clear
              </Button>
            )}
            <div className="text-sm text-gray-500 ml-auto">
              {loading ? '...' : `${pagination.total} customers`}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No customers found</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedCustomer?.id === c.id ? 'border-smt-red bg-red-50/50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{c.email}</p>
                          {(c._count.machines > 0) && (
                            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {c._count.machines} machine{c._count.machines !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Detail + Chat */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {[selectedCustomer.firstName, selectedCustomer.lastName].filter(Boolean).join(' ') || '—'}
                    </h3>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${selectedCustomer.email}`} className="text-blue-600 hover:underline">
                          {selectedCustomer.email}
                        </a>
                      </div>
                      {selectedCustomer.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {selectedCustomer.phone}
                        </div>
                      )}
                      {selectedCustomer.company && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {selectedCustomer.company}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        Registered {formatDate(selectedCustomer.createdAt)}
                      </div>
                    </div>
                  </div>
                  {selectedCustomer.machines && selectedCustomer.machines.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-2">Registered Machines</h4>
                      <div className="space-y-2">
                        {selectedCustomer.machines.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-2 rounded border bg-gray-50/50"
                          >
                            <span className="font-medium text-gray-900">{m.model}</span>
                            <span className="text-xs text-gray-500 font-mono">S/N: {m.serialNumber}</span>
                            <Badge variant="outline" className="text-xs">
                              {m.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCustomer._count.tickets > 0 && (
                    <p className="text-sm text-gray-500">
                      <strong>{selectedCustomer._count.tickets}</strong> support ticket(s)
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Select a customer to view details</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat sessions & history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5" />
                Chat History
              </CardTitle>
              <p className="text-sm text-gray-500 font-normal">
                Sessions linked to this customer (from app chat)
              </p>
            </CardHeader>
            <CardContent>
              {!selectedCustomer ? (
                <div className="text-center py-6 text-gray-500 text-sm">Select a customer to see chat sessions</div>
              ) : sessionsLoading ? (
                <div className="text-center py-6 text-gray-500">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No chat sessions for this customer</div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedSessionId === s.sessionId ? 'border-smt-red bg-red-50/50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSessionId(s.sessionId)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(s.createdAt)} · {s._count.messages} messages
                            </p>
                            {(s.machineModel || s.serialNumber) && (
                              <p className="text-xs text-gray-500">
                                {[s.machineModel, s.serialNumber && `S/N ${s.serialNumber}`].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedSessionId && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-xs font-medium text-gray-500 mb-2">Messages</h4>
                      {messagesLoading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                      ) : chatMessages.length === 0 ? (
                        <div className="text-sm text-gray-500">No messages in this session</div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-2 rounded text-sm ${
                                msg.role === 'user'
                                  ? 'bg-blue-50 text-blue-900 ml-4'
                                  : 'bg-gray-100 text-gray-800 mr-4'
                              }`}
                            >
                              <span className="text-xs font-medium text-gray-500">{msg.role}</span>
                              <p className="mt-1 whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatDate(msg.createdAt)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
