'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Check } from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    contestUpdates: true,
    newProjects: false,
    marketingEmails: false,
    pointsUpdates: true,
    billingAlerts: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/users/settings', { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.notifications) {
          setSettings(prev => ({
            ...prev,
            ...result.data.notifications
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch notification settings:', err);
    } finally {
      setLoaded(true);
    }
  };

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/users/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          notifications: settings
        })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to save notification settings');
      }
    } catch (err) {
      console.error('Failed to save notification settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotifications" className="text-gray-300">
              Email Notifications
            </Label>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={() => handleToggle('emailNotifications')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="contestUpdates" className="text-gray-300">
              Contest Updates
            </Label>
            <Switch
              id="contestUpdates"
              checked={settings.contestUpdates}
              onCheckedChange={() => handleToggle('contestUpdates')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="newProjects" className="text-gray-300">
              New Project Notifications
            </Label>
            <Switch
              id="newProjects"
              checked={settings.newProjects}
              onCheckedChange={() => handleToggle('newProjects')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="marketingEmails" className="text-gray-300">
              Marketing Emails
            </Label>
            <Switch
              id="marketingEmails"
              checked={settings.marketingEmails}
              onCheckedChange={() => handleToggle('marketingEmails')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="pointsUpdates" className="text-gray-300">
              Points Updates
            </Label>
            <Switch
              id="pointsUpdates"
              checked={settings.pointsUpdates}
              onCheckedChange={() => handleToggle('pointsUpdates')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="billingAlerts" className="text-gray-300">
              Billing Alerts
            </Label>
            <Switch
              id="billingAlerts"
              checked={settings.billingAlerts}
              onCheckedChange={() => handleToggle('billingAlerts')}
            />
          </div>
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#8B4513] hover:bg-[#A0522D] text-white"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
          ) : saved ? (
            <><Check className="w-4 h-4 mr-2" />Saved!</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />Save Preferences</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
