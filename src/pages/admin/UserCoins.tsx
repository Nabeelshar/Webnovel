
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Search, Coins, Plus, Minus } from 'lucide-react';

interface User {
  id: string;
  username: string;
  display_name: string | null;
  coins: number;
}

const UserCoins = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [coinAmount, setCoinAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, coins')
        .order('username', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openAdjustDialog = (user: User, type: 'add' | 'deduct') => {
    setSelectedUser(user);
    setAdjustmentType(type);
    setCoinAmount(0);
    setReason('');
    setShowAdjustDialog(true);
  };

  const handleCoinAdjustment = async () => {
    if (!selectedUser || coinAmount <= 0) return;
    
    try {
      const finalAmount = adjustmentType === 'add' ? coinAmount : -coinAmount;
      
      // First, update the user's coin balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          coins: selectedUser.coins + finalAmount 
        })
        .eq('id', selectedUser.id);
        
      if (updateError) throw updateError;
      
      // Then, record the transaction
      const { error: transactionError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: selectedUser.id,
          amount: finalAmount,
          transaction_type: adjustmentType === 'add' ? 'admin_add' : 'admin_deduct',
          description: reason || `Admin ${adjustmentType === 'add' ? 'added' : 'deducted'} coins`
        });
        
      if (transactionError) throw transactionError;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, coins: user.coins + finalAmount } 
          : user
      ));
      
      toast({
        title: "Coins Adjusted",
        description: `Successfully ${adjustmentType === 'add' ? 'added' : 'deducted'} ${coinAmount} coins ${adjustmentType === 'add' ? 'to' : 'from'} ${selectedUser.username}`
      });
      
      setShowAdjustDialog(false);
    } catch (error: any) {
      console.error('Error adjusting coins:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${adjustmentType} coins`,
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Manage User Coins</h2>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Username</th>
                    <th className="text-left py-3 px-4 font-medium">Display Name</th>
                    <th className="text-center py-3 px-4 font-medium">
                      <div className="flex items-center justify-center">
                        <Coins className="h-4 w-4 mr-2" />
                        Coins
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No users matching your search" : "No users found"}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{user.username}</td>
                        <td className="py-3 px-4">{user.display_name || '-'}</td>
                        <td className="py-3 px-4 text-center font-medium">{user.coins}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openAdjustDialog(user, 'add')}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Plus size={16} className="mr-1" />
                              Add
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openAdjustDialog(user, 'deduct')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={user.coins <= 0}
                            >
                              <Minus size={16} className="mr-1" />
                              Deduct
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === 'add' ? 'Add Coins to' : 'Deduct Coins from'} {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center">
              <label className="w-24 text-sm font-medium">Current</label>
              <div className="flex items-center bg-muted rounded px-3 py-2">
                <Coins className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{selectedUser?.coins || 0}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <label htmlFor="coinAmount" className="w-24 text-sm font-medium">
                {adjustmentType === 'add' ? 'Add' : 'Deduct'}
              </label>
              <div className="flex items-center">
                <Input
                  id="coinAmount"
                  type="number"
                  min="0"
                  value={coinAmount || ''}
                  onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                  className="w-32"
                />
                <Coins className="h-4 w-4 ml-2 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex items-center">
              <label className="w-24 text-sm font-medium">New total</label>
              <div className="flex items-center bg-muted rounded px-3 py-2">
                <Coins className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {selectedUser 
                    ? adjustmentType === 'add' 
                      ? selectedUser.coins + coinAmount 
                      : selectedUser.coins - Math.min(coinAmount, selectedUser.coins)
                    : 0}
                </span>
              </div>
            </div>
            
            <div>
              <label htmlFor="reason" className="block text-sm font-medium mb-1">
                Reason (optional)
              </label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for adjustment"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCoinAdjustment}
              disabled={coinAmount <= 0}
              variant={adjustmentType === 'add' ? 'default' : 'destructive'}
            >
              {adjustmentType === 'add' ? 'Add Coins' : 'Deduct Coins'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserCoins;
