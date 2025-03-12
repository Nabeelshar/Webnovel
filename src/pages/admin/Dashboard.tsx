import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Container from '@/components/common/Container';
import NovelManagement from './NovelManagement';
import PageManagement from './PageManagement';
import PaymentSettings from './PaymentSettings';
import FeaturedContent from './FeaturedContent';
import UserManagement from './UserManagement';
import MenuManagement from './MenuManagement';
import AdminHeader from '@/components/admin/AdminHeader';

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        if (!loading) {
          navigate('/auth/login');
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (!data?.is_admin) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin area",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        
        setIsAdmin(true);
      } catch (error: any) {
        console.error('Error checking admin status:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to verify admin permissions",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate, toast, loading]);

  if (loading) {
    return (
      <Container className="py-12">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Container>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="pt-6 pb-16">
      <AdminHeader />
      
      <Container className="mt-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <Tabs defaultValue="novels" className="w-full">
          <TabsList className="mb-8 bg-background border border-border">
            <TabsTrigger value="novels">Novel Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="pages">Page Management</TabsTrigger>
            <TabsTrigger value="menus">Menu Management</TabsTrigger>
            <TabsTrigger value="featured">Featured Content</TabsTrigger>
            <TabsTrigger value="payments">Payment Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="novels" className="mt-4">
            <NovelManagement />
          </TabsContent>
          
          <TabsContent value="users" className="mt-4">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="pages" className="mt-4">
            <PageManagement />
          </TabsContent>
          
          <TabsContent value="menus" className="mt-4">
            <MenuManagement />
          </TabsContent>
          
          <TabsContent value="featured" className="mt-4">
            <FeaturedContent />
          </TabsContent>
          
          <TabsContent value="payments" className="mt-4">
            <PaymentSettings />
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
};

export default AdminDashboard;
