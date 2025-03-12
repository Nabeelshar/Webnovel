
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, BookOpen, Users, FileText, Star, CreditCard, Menu } from 'lucide-react';
import Container from '@/components/common/Container';

const AdminHeader = () => {
  return (
    <div className="bg-secondary/30 border-b border-border py-3">
      <Container>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className="flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Site
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                to="/admin" 
                className="flex items-center text-sm font-medium hover:text-primary transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
              
              <Link 
                to="/admin?tab=novels" 
                className="flex items-center text-sm font-medium hover:text-primary transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Novels
              </Link>
              
              <Link 
                to="/admin?tab=users" 
                className="flex items-center text-sm font-medium hover:text-primary transition-colors"
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </Link>
              
              <Link 
                to="/admin?tab=pages" 
                className="flex items-center text-sm font-medium hover:text-primary transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Pages
              </Link>
              
              <Link 
                to="/admin?tab=menus" 
                className="flex items-center text-sm font-medium hover:text-primary transition-colors"
              >
                <Menu className="w-4 h-4 mr-2" />
                Menus
              </Link>
              
              <Link 
                to="/admin?tab=featured" 
                className="flex items-center text-sm font-medium hover:text-primary transition-colors"
              >
                <Star className="w-4 h-4 mr-2" />
                Featured
              </Link>
              
              <Link 
                to="/admin?tab=payments" 
                className="flex items-center text-sm font-medium hover:text-primary transition-colors"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Payments
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AdminHeader;
