
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, CreditCard, Check } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";

interface CoinPackage {
  id: string;
  name: string;
  description: string | null;
  coin_amount: number;
  price: number;
  currency: string;
  is_featured: boolean;
  is_active: boolean;
}

const PurchaseCoins = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [successDialog, setSuccessDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchCoinPackages();
  }, []);

  const fetchCoinPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coin_packages')
        .select('*')
        .eq('is_active', true)
        .order('coin_amount', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      console.error('Error fetching coin packages:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load coin packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openPaymentDialog = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    setPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedPackage || !user || !profile) return;
    
    setPaymentLoading(true);
    
    try {
      // For demonstration purposes, simulate payment process
      // In a real app, this would connect to Stripe or other payment processor
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add coins to user's account
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          coins: profile.coins + selectedPackage.coin_amount 
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Record the transaction
      const { error: transactionError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          amount: selectedPackage.coin_amount,
          transaction_type: 'purchase',
          description: `Purchased ${selectedPackage.name} package`
        });
        
      if (transactionError) throw transactionError;
      
      setPaymentDialog(false);
      setSuccessDialog(true);
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Purchase Coins</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Coins can be used to unlock premium chapters and support your favorite authors.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : (
        <>
          {packages.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p>No coin packages are currently available. Please check back later.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <Card key={pkg.id} className={`overflow-hidden ${pkg.is_featured ? 'border-primary shadow-lg' : ''}`}>
                  {pkg.is_featured && (
                    <div className="bg-primary text-primary-foreground text-center py-1 text-xs font-medium">
                      MOST POPULAR
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{pkg.name}</span>
                      <Coins className="h-5 w-5 text-amber-500" />
                    </CardTitle>
                    {pkg.description && (
                      <CardDescription>{pkg.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2 flex items-center gap-2">
                      <Coins className="h-6 w-6 text-amber-500" /> 
                      {pkg.coin_amount.toLocaleString()}
                    </div>
                    <div className="text-xl font-semibold text-muted-foreground">
                      ${pkg.price.toFixed(2)} {pkg.currency}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => openPaymentDialog(pkg)} 
                      className="w-full"
                      variant={pkg.is_featured ? "default" : "outline"}
                    >
                      Purchase
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Coins</DialogTitle>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="py-4">
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Package:</span>
                  <span>{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Coins:</span>
                  <span className="flex items-center">
                    <Coins className="h-4 w-4 text-amber-500 mr-1" />
                    {selectedPackage.coin_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold">${selectedPackage.price.toFixed(2)} {selectedPackage.currency}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center mb-3">
                    <CreditCard className="h-5 w-5 mr-2" />
                    <span className="font-medium">Payment Method</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    This is a demo application. No actual payment will be processed.
                  </p>
                  
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <div className="h-8 w-12 bg-gray-200 rounded mr-3"></div>
                    <span>Demo Card •••• 4242</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)} disabled={paymentLoading}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={paymentLoading}>
              {paymentLoading ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="max-w-md">
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Purchase Successful!</h3>
            <p className="text-muted-foreground mb-4">
              {selectedPackage?.coin_amount.toLocaleString()} coins have been added to your account.
            </p>
            <Button onClick={() => setSuccessDialog(false)}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseCoins;
