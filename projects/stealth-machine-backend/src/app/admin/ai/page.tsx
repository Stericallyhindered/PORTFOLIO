'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bot, Settings, FileText, Save, PlayCircle, Plus, Trash2, X, Send, ToggleLeft, ToggleRight, Tag } from 'lucide-react';

interface AIPrompt {
  id: string;
  name: string;
  displayName: string;
  prompt: string;
  description: string | null;
  variables: string[];
  isActive: boolean;
  version: number;
}

interface AIConfig {
  id: string;
  key: string;
  value: string;
  type: string;
  description: string | null;
}

interface TestMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIConfigPage() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [editedConfigs, setEditedConfigs] = useState<Record<string, string>>({});
  const [selectedPrompt, setSelectedPrompt] = useState<AIPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  
  // New prompt modal state
  const [showNewPromptModal, setShowNewPromptModal] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    displayName: '',
    description: '',
    prompt: '',
    variables: [] as string[],
  });
  const [creatingPrompt, setCreatingPrompt] = useState(false);
  
  // Test AI modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  
  // Variables editor state
  const [newVariable, setNewVariable] = useState('');
  const [newPromptVariable, setNewPromptVariable] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [promptsRes, configsRes] = await Promise.all([
        fetch('/api/ai/prompts'),
        fetch('/api/ai/config'),
      ]);
      
      const promptsData = await promptsRes.json();
      const configsData = await configsRes.json();
      
      if (promptsData.success) setPrompts(promptsData.data);
      if (configsData.success) {
        setConfigs(configsData.data);
        // Initialize edited configs with current values
        const initialConfigs: Record<string, string> = {};
        configsData.data.forEach((c: AIConfig) => {
          initialConfigs[c.key] = c.value;
        });
        setEditedConfigs(initialConfigs);
      }
      
      if (promptsData.data?.length > 0) {
        setSelectedPrompt(promptsData.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch AI config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedPrompt) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/ai/prompts/${selectedPrompt.name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: selectedPrompt.prompt,
          displayName: selectedPrompt.displayName,
          description: selectedPrompt.description,
          variables: selectedPrompt.variables,
          isActive: selectedPrompt.isActive,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update the prompt in the list with new version
        setPrompts(prompts.map(p => p.id === selectedPrompt.id ? { ...selectedPrompt, version: result.data?.version || selectedPrompt.version + 1 } : p));
        setSelectedPrompt(prev => prev ? { ...prev, version: result.data?.version || prev.version + 1 } : null);
        alert('Prompt saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save prompt: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save prompt:', error);
      alert('Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfigs = async () => {
    setSavingConfig(true);
    try {
      const configsToUpdate = Object.entries(editedConfigs).map(([key, value]) => ({
        key,
        value,
        type: configs.find(c => c.key === key)?.type || 'string',
        description: configs.find(c => c.key === key)?.description,
      }));

      const response = await fetch('/api/ai/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: configsToUpdate }),
      });
      
      if (response.ok) {
        await fetchData(); // Refresh to get updated data
        alert('AI settings saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save settings: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save configs:', error);
      alert('Failed to save settings');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setEditedConfigs(prev => ({ ...prev, [key]: value }));
  };

  const handleCreatePrompt = async () => {
    if (!newPrompt.name || !newPrompt.displayName || !newPrompt.prompt) {
      alert('Please fill in name, display name, and prompt content');
      return;
    }
    
    setCreatingPrompt(true);
    try {
      const response = await fetch('/api/ai/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPrompt.name.toLowerCase().replace(/\s+/g, '_'),
          displayName: newPrompt.displayName,
          description: newPrompt.description || null,
          prompt: newPrompt.prompt,
          variables: newPrompt.variables,
          isActive: true,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setPrompts([...prompts, result.data]);
        setShowNewPromptModal(false);
        setNewPrompt({ name: '', displayName: '', description: '', prompt: '', variables: [] });
        alert('Prompt created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create prompt: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create prompt:', error);
      alert('Failed to create prompt');
    } finally {
      setCreatingPrompt(false);
    }
  };

  const handleDeletePrompt = async () => {
    if (!selectedPrompt) return;
    
    const corePrompts = ['main_system', 'troubleshooting', 'safety'];
    if (corePrompts.includes(selectedPrompt.name)) {
      alert('Cannot delete core system prompts');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${selectedPrompt.displayName}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/ai/prompts/${selectedPrompt.name}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPrompts(prompts.filter(p => p.id !== selectedPrompt.id));
        setSelectedPrompt(prompts.length > 1 ? prompts.find(p => p.id !== selectedPrompt.id) || null : null);
        alert('Prompt deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete prompt: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      alert('Failed to delete prompt');
    }
  };

  const handleToggleActive = () => {
    if (!selectedPrompt) return;
    setSelectedPrompt({ ...selectedPrompt, isActive: !selectedPrompt.isActive });
  };

  const handleAddVariable = () => {
    if (!newVariable.trim() || !selectedPrompt) return;
    if (selectedPrompt.variables.includes(newVariable.trim())) {
      alert('Variable already exists');
      return;
    }
    setSelectedPrompt({
      ...selectedPrompt,
      variables: [...selectedPrompt.variables, newVariable.trim()],
    });
    setNewVariable('');
  };

  const handleRemoveVariable = (variable: string) => {
    if (!selectedPrompt) return;
    setSelectedPrompt({
      ...selectedPrompt,
      variables: selectedPrompt.variables.filter(v => v !== variable),
    });
  };

  const handleAddNewPromptVariable = () => {
    if (!newPromptVariable.trim()) return;
    if (newPrompt.variables.includes(newPromptVariable.trim())) {
      alert('Variable already exists');
      return;
    }
    setNewPrompt({
      ...newPrompt,
      variables: [...newPrompt.variables, newPromptVariable.trim()],
    });
    setNewPromptVariable('');
  };

  const handleRemoveNewPromptVariable = (variable: string) => {
    setNewPrompt({
      ...newPrompt,
      variables: newPrompt.variables.filter(v => v !== variable),
    });
  };

  const handleTestAI = async () => {
    if (!testInput.trim()) return;
    
    const userMessage: TestMessage = { role: 'user', content: testInput };
    setTestMessages(prev => [...prev, userMessage]);
    setTestInput('');
    setTestLoading(true);
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...testMessages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          sessionId: 'admin-test-' + Date.now(),
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        const assistantMessage: TestMessage = {
          role: 'assistant',
          content: result.data?.content || 'No response received',
        };
        setTestMessages(prev => [...prev, assistantMessage]);
      } else {
        const error = await response.json();
        setTestMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${error.error || 'Failed to get response'}`,
        }]);
      }
    } catch (error) {
      console.error('Failed to test AI:', error);
      setTestMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error: Failed to connect to AI service',
      }]);
    } finally {
      setTestLoading(false);
    }
  };

  const hasConfigChanges = () => {
    return configs.some(c => editedConfigs[c.key] !== c.value);
  };

  const corePrompts = ['main_system', 'troubleshooting', 'safety'];
  const isCorePr = selectedPrompt ? corePrompts.includes(selectedPrompt.name) : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Configuration</h1>
          <p className="text-gray-500">Configure AI prompts, models, and settings</p>
        </div>
        <Button variant="outline" onClick={() => { setShowTestModal(true); setTestMessages([]); }}>
          <PlayCircle className="h-4 w-4 mr-2" />
          Test AI
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompts List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Prompts
            </CardTitle>
            <CardDescription>Select a prompt to edit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => setSelectedPrompt(prompt)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedPrompt?.id === prompt.id
                      ? 'bg-smt-red/10 border-smt-red'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{prompt.displayName}</span>
                    <Badge variant={prompt.isActive ? 'success' : 'secondary'}>
                      {prompt.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {prompt.description || prompt.name}
                  </p>
                </button>
              ))}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setShowNewPromptModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Prompt
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Prompt Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Prompt Editor
                </CardTitle>
                <CardDescription>
                  Edit the system prompt that defines the AI behavior
                </CardDescription>
              </div>
              {selectedPrompt && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleActive}
                    className={selectedPrompt.isActive ? 'text-green-600' : 'text-gray-500'}
                  >
                    {selectedPrompt.isActive ? (
                      <ToggleRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 mr-1" />
                    )}
                    {selectedPrompt.isActive ? 'Active' : 'Inactive'}
                  </Button>
                  {!isCorePr && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeletePrompt}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedPrompt ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input
                      value={selectedPrompt.displayName}
                      onChange={(e) =>
                        setSelectedPrompt({ ...selectedPrompt, displayName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Internal Name</Label>
                    <Input
                      value={selectedPrompt.name}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={selectedPrompt.description || ''}
                    onChange={(e) =>
                      setSelectedPrompt({ ...selectedPrompt, description: e.target.value })
                    }
                    placeholder="Brief description of this prompt"
                  />
                </div>
                
                {/* Variables Editor */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Variables
                  </Label>
                  <p className="text-xs text-gray-500">
                    Variables that can be injected into this prompt (e.g., materials, products)
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedPrompt.variables?.map((variable) => (
                      <Badge key={variable} variant="secondary" className="flex items-center gap-1">
                        {variable}
                        <button
                          onClick={() => handleRemoveVariable(variable)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {(!selectedPrompt.variables || selectedPrompt.variables.length === 0) && (
                      <span className="text-sm text-gray-400">No variables defined</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      placeholder="Add variable name"
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddVariable()}
                    />
                    <Button variant="outline" size="sm" onClick={handleAddVariable}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Prompt Content</Label>
                  <textarea
                    className="w-full h-64 p-3 rounded-md border border-input bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    value={selectedPrompt.prompt}
                    onChange={(e) =>
                      setSelectedPrompt({ ...selectedPrompt, prompt: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    {selectedPrompt.prompt.length} characters | Version {selectedPrompt.version}
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => fetchData()}>
                    Reset
                  </Button>
                  <Button onClick={handleSavePrompt} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a prompt to edit
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                AI Model Settings
              </CardTitle>
              <CardDescription>Configure the AI model parameters</CardDescription>
            </div>
            <Button 
              onClick={handleSaveConfigs} 
              disabled={savingConfig || !hasConfigChanges()}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {savingConfig ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {configs.map((config) => (
              <div key={config.id} className="space-y-2">
                <Label>{config.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                <Input
                  value={editedConfigs[config.key] || ''}
                  type={config.type === 'number' ? 'number' : 'text'}
                  step={config.key === 'temperature' ? '0.1' : undefined}
                  min={config.type === 'number' ? '0' : undefined}
                  onChange={(e) => handleConfigChange(config.key, e.target.value)}
                />
                {config.description && (
                  <p className="text-xs text-gray-500">{config.description}</p>
                )}
              </div>
            ))}
          </div>
          {hasConfigChanges() && (
            <p className="text-sm text-amber-600 mt-4">You have unsaved changes</p>
          )}
        </CardContent>
      </Card>

      {/* New Prompt Modal */}
      {showNewPromptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create New Prompt</h2>
              <button onClick={() => setShowNewPromptModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Internal Name *</Label>
                  <Input
                    value={newPrompt.name}
                    onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                    placeholder="e.g., custom_greeting"
                  />
                  <p className="text-xs text-gray-500">Lowercase, underscores only</p>
                </div>
                <div className="space-y-2">
                  <Label>Display Name *</Label>
                  <Input
                    value={newPrompt.displayName}
                    onChange={(e) => setNewPrompt({ ...newPrompt, displayName: e.target.value })}
                    placeholder="e.g., Custom Greeting"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newPrompt.description}
                  onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                  placeholder="Brief description of this prompt"
                />
              </div>
              
              {/* Variables for new prompt */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Variables
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newPrompt.variables.map((variable) => (
                    <Badge key={variable} variant="secondary" className="flex items-center gap-1">
                      {variable}
                      <button
                        onClick={() => handleRemoveNewPromptVariable(variable)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newPromptVariable}
                    onChange={(e) => setNewPromptVariable(e.target.value)}
                    placeholder="Add variable name"
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewPromptVariable()}
                  />
                  <Button variant="outline" size="sm" onClick={handleAddNewPromptVariable}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prompt Content *</Label>
                <textarea
                  className="w-full h-48 p-3 rounded-md border border-input bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newPrompt.prompt}
                  onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                  placeholder="Enter the system prompt..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={() => setShowNewPromptModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePrompt} disabled={creatingPrompt}>
                {creatingPrompt ? 'Creating...' : 'Create Prompt'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Test AI Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Test AI Chat</h2>
              <button onClick={() => setShowTestModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {testMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Send a message to test the AI</p>
                  <p className="text-sm mt-1">This will use the current saved prompts and settings</p>
                </div>
              )}
              {testMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-smt-red text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {testLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-sm text-gray-500">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Type a test message..."
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleTestAI()}
                  disabled={testLoading}
                />
                <Button onClick={handleTestAI} disabled={testLoading || !testInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send. This tests against the live AI with current settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
