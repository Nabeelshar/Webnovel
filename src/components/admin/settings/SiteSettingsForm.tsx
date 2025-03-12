
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Save } from 'lucide-react';

interface SiteSettings {
  id?: string;
  site_name: string;
  footer_site_name: string;
  site_tagline: string;
  created_at?: string;
  updated_at?: string;
}

const defaultSettings: SiteSettings = {
  site_name: 'NovelVerse',
  footer_site_name: 'NovelHaven',
  site_tagline: 'Discover the best stories from emerging and established authors.',
};

const SiteSettingsForm = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Using raw query to avoid type issues until Supabase types are regenerated
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data as unknown as SiteSettings);
      } else {
        // Use defaults if no settings exist
        setSettings(defaultSettings);
      }
    } catch (error: any) {
      console.error('Error fetching site settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load site settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Using a raw query approach to avoid type issues
      const { data: existingSettings } = await supabase
        .from('site_settings')
        .select('id')
        .maybeSingle();
      
      if (existingSettings?.id) {
        // Update existing settings
        const { error } = await supabase
          .from('site_settings')
          .update({
            site_name: settings.site_name,
            footer_site_name: settings.footer_site_name,
            site_tagline: settings.site_tagline,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', existingSettings.id);
          
        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('site_settings')
          .insert({
            site_name: settings.site_name,
            footer_site_name: settings.footer_site_name,
            site_tagline: settings.site_tagline
          } as any);
          
        if (error) throw error;
      }
      
      toast({
        title: "Settings Saved",
        description: "Site settings have been updated successfully.",
      });
      
    } catch (error: any) {
      console.error('Error saving site settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save site settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site_name">Site Name (Header)</Label>
            <Input
              id="site_name"
              name="site_name"
              value={settings.site_name}
              onChange={handleChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              This is displayed in the header of your site
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="footer_site_name">Site Name (Footer)</Label>
            <Input
              id="footer_site_name"
              name="footer_site_name"
              value={settings.footer_site_name}
              onChange={handleChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              This is displayed in the footer of your site
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="site_tagline">Site Tagline</Label>
            <Textarea
              id="site_tagline"
              name="site_tagline"
              value={settings.site_tagline}
              onChange={handleChange}
              rows={3}
              required
            />
            <p className="text-sm text-muted-foreground">
              A short description displayed in the footer
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SiteSettingsForm;
