
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Container from '../common/Container';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink } from 'lucide-react';

interface MenuItem {
  id: string;
  title: string;
  url: string;
  parent_id: string | null;
}

interface SiteSettings {
  site_name: string;
  footer_site_name: string;
  site_tagline: string;
}

const defaultSettings = {
  site_name: 'NovelVerse',
  footer_site_name: 'NovelHaven',
  site_tagline: 'Discover the best stories from emerging and established authors.'
};

const Footer = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([
      fetchFooterMenuItems(),
      fetchSiteSettings()
    ]).then(() => setLoading(false));
  }, []);
  
  const fetchFooterMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, title, url, parent_id')
        .eq('menu_location', 'footer')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
        
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching footer menu items:', error);
    }
  };
  
  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSettings(data as unknown as SiteSettings);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  };
  
  // Get parent menu items
  const parentMenuItems = menuItems.filter(item => !item.parent_id);
  
  // Get child menu items for a given parent
  const getChildMenuItems = (parentId: string) => {
    return menuItems.filter(item => item.parent_id === parentId);
  };
  
  // If no menu items are configured, use these default links
  const defaultLinks = [
    { title: 'Home', url: '/' },
    { title: 'Browse', url: '/browse' },
    { title: 'Genres', url: '/genres' },
    { title: 'Rankings', url: '/rankings' },
  ];
  
  // Use dynamic menu items if available, otherwise fall back to defaults
  const displayMenuItems = parentMenuItems.length > 0 ? parentMenuItems : defaultLinks.map((link, index) => ({
    id: `default-${index}`,
    title: link.title,
    url: link.url,
    parent_id: null
  }));
  
  return (
    <footer className="bg-gray-50 border-t py-10">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-xl font-bold mb-4">{settings.footer_site_name}</h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              {settings.site_tagline}
            </p>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {settings.footer_site_name}. All rights reserved.
            </p>
          </div>
          
          <div className="col-span-1">
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {displayMenuItems.slice(0, Math.ceil(displayMenuItems.length / 2)).map(item => (
                <li key={item.id}>
                  {item.url.startsWith('http') ? (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors flex items-center"
                    >
                      {item.title}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  ) : (
                    <Link 
                      to={item.url} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.title}
                    </Link>
                  )}
                  
                  {/* Render child menu items if any */}
                  {getChildMenuItems(item.id).length > 0 && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {getChildMenuItems(item.id).map(childItem => (
                        <li key={childItem.id}>
                          {childItem.url.startsWith('http') ? (
                            <a 
                              href={childItem.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center"
                            >
                              {childItem.title}
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          ) : (
                            <Link 
                              to={childItem.url} 
                              className="text-muted-foreground hover:text-primary transition-colors text-sm"
                            >
                              {childItem.title}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="font-semibold mb-4">More</h3>
            <ul className="space-y-2">
              {displayMenuItems.slice(Math.ceil(displayMenuItems.length / 2)).map(item => (
                <li key={item.id}>
                  {item.url.startsWith('http') ? (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors flex items-center"
                    >
                      {item.title}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  ) : (
                    <Link 
                      to={item.url} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.title}
                    </Link>
                  )}
                  
                  {/* Render child menu items if any */}
                  {getChildMenuItems(item.id).length > 0 && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {getChildMenuItems(item.id).map(childItem => (
                        <li key={childItem.id}>
                          {childItem.url.startsWith('http') ? (
                            <a 
                              href={childItem.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center"
                            >
                              {childItem.title}
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          ) : (
                            <Link 
                              to={childItem.url} 
                              className="text-muted-foreground hover:text-primary transition-colors text-sm"
                            >
                              {childItem.title}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
