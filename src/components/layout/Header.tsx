
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { User, BookText, LogOut, PenSquare, Coins } from 'lucide-react';
import Container from '../common/Container';
import { supabase } from '@/integrations/supabase/client';

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

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchHeaderMenuItems(),
      fetchSiteSettings()
    ]).then(() => setLoading(false));
  }, []);

  const fetchHeaderMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, title, url, parent_id')
        .eq('menu_location', 'header')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching header menu items:', error);
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Filter to get only top-level menu items (no parent)
  const topLevelMenuItems = menuItems.filter(item => !item.parent_id);

  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="font-bold text-2xl">{settings.site_name}</Link>
          
          <nav className="flex items-center gap-4">
            {topLevelMenuItems.map(item => (
              <Link 
                key={item.id} 
                to={item.url} 
                className="hover:text-primary transition-colors"
              >
                {item.title}
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => navigate('/purchase-coins')} 
                  size="sm" 
                  className="bg-amber-500 hover:bg-amber-600 text-white flex items-center"
                >
                  <Coins className="h-4 w-4 mr-1" /> 
                  {profile?.coins || 0} Coins
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.display_name || profile?.username}`} alt={profile?.display_name || profile?.username} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="h-4 w-4 mr-2" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Author Tools</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate('/author/novels')}>
                        <BookText className="h-4 w-4 mr-2" />
                        <span>Manage Novels</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/author/novels/create')}>
                        <PenSquare className="h-4 w-4 mr-2" />
                        <span>Write New Novel</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/auth/login" className="hover:text-primary transition-colors">Login</Link>
                <Link to="/auth/signup" className="hover:text-primary transition-colors">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </Container>
    </header>
  );
};

export default Header;
