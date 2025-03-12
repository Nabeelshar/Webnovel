
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BuyCoinsButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const BuyCoinsButton: React.FC<BuyCoinsButtonProps> = ({
  variant = 'default',
  size = 'default',
  showIcon = true,
  fullWidth = false,
  className = '',
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // If not logged in, redirect to login page
        navigate('/auth/login?redirect=/purchase-coins');
        return;
      }
      
      // If logged in, go to the purchase coins page
      navigate('/purchase-coins');
    } catch (error) {
      console.error('Error navigating to purchase page:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={handleClick}
      disabled={loading}
    >
      {showIcon && <Coins className="mr-2 h-4 w-4" />}
      {loading ? 'Loading...' : 'Buy Coins'}
    </Button>
  );
};
