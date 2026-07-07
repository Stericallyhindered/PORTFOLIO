'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Save, Trash2, Loader2, Check } from 'lucide-react';

export const PrivacySettings: React.FC = () => {
  const [settings, setSettings] = useState({
    profileVisibility: true,
    showEmail: false,
    showProjects: true,
    allowDataCollection: false,
    showOnlineStatus: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/users/settings', { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.privacy) {
          setSettings(prev => ({
            ...prev,
            ...result.data.privacy
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch privacy settings:', err);
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
          privacy: settings
        })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to save privacy settings');
      }
    } catch (err) {
      console.error('Failed to save privacy settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const response = await fetch('/api/users/settings', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Account deletion request submitted. You will be logged out.');
        window.location.href = '/login';
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to delete account. Please contact support.');
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('Failed to delete account. Please contact support.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Privacy Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="profileVisibility" className="text-gray-300">
              Public Profile
            </Label>
            <Switch
              id="profileVisibility"
              checked={settings.profileVisibility}
              onCheckedChange={() => handleToggle('profileVisibility')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showEmail" className="text-gray-300">
              Show Email Address
            </Label>
            <Switch
              id="showEmail"
              checked={settings.showEmail}
              onCheckedChange={() => handleToggle('showEmail')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showProjects" className="text-gray-300">
              Show My Projects
            </Label>
            <Switch
              id="showProjects"
              checked={settings.showProjects}
              onCheckedChange={() => handleToggle('showProjects')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="allowDataCollection" className="text-gray-300">
              Allow Data Collection
            </Label>
            <Switch
              id="allowDataCollection"
              checked={settings.allowDataCollection}
              onCheckedChange={() => handleToggle('allowDataCollection')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showOnlineStatus" className="text-gray-300">
              Show Online Status
            </Label>
            <Switch
              id="showOnlineStatus"
              checked={settings.showOnlineStatus}
              onCheckedChange={() => handleToggle('showOnlineStatus')}
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
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
              <><Save className="w-4 h-4 mr-2" />Save Privacy Settings</>
            )}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#2D2D2D] border-gray-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-300">
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>
                  ) : (
                    'Delete Account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
