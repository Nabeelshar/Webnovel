import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowUpRight, 
  DollarSign, 
  CreditCard, 
  Settings, 
  PlusCircle,
  Pencil, 
  Trash,
  AlertCircle
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

interface PaymentProvider {
  id: string;
  provider: string;
  is_enabled: boolean;
  config: {
    live_mode: boolean;
    api_key?: string;
    secret_key?: string;
    client_id?: string;
    client_secret?: string;
    webhook_url?: string;
    currency?: string;
  };
  created_at: string;
  updated_at: string;
}

interface CoinPackage {
  id: string;
  name: string;
  description: string | null;
  coin_amount: number;
  price: number;
  currency: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PaymentSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('stripe');
  const [stripeSettings, setStripeSettings] = useState({
    live_mode: false,
    api_key: '',
    secret_key: '',
    webhook_url: '',
    currency: 'USD'
  });
  const [paypalSettings, setPaypalSettings] = useState({
    live_mode: false,
    client_id: '',
    client_secret: '',
    webhook_url: '',
    currency: 'USD'
  });
  const [packageDialog, setPackageDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [packageFormData, setPackageFormData] = useState({
    name: '',
    description: '',
    coin_amount: 100,
    price: 4.99,
    currency: 'USD',
    is_featured: false,
    is_active: true
  });
  const [deletePackageDialog, setDeletePackageDialog] = useState(false);

  useEffect(() => {
    fetchPaymentSettings();
    fetchCoinPackages();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .order('provider', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Transform the data to ensure correct typing
        const transformedData: PaymentProvider[] = data.map(provider => ({
          ...provider,
          config: typeof provider.config === 'string' 
            ? JSON.parse(provider.config)
            : provider.config
        }));
        
        setPaymentProviders(transformedData);
        
        // Setup Stripe settings
        const stripeProvider = transformedData.find(p => p.provider === 'stripe');
        if (stripeProvider) {
          setStripeEnabled(stripeProvider.is_enabled);
          setStripeSettings(stripeProvider.config as typeof stripeSettings);
        }
        
        // Setup PayPal settings
        const paypalProvider = transformedData.find(p => p.provider === 'paypal');
        if (paypalProvider) {
          setPaypalEnabled(paypalProvider.is_enabled);
          setPaypalSettings(paypalProvider.config as typeof paypalSettings);
        }
      } else {
        // Create default settings if not exist
        await createDefaultSettings();
      }
    } catch (error: any) {
      console.error('Error fetching payment settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load payment settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    try {
      // Create Stripe settings
      const { error: stripeError } = await supabase
        .from('payment_settings')
        .insert({
          provider: 'stripe',
          is_enabled: false,
          config: {
            live_mode: false,
            api_key: '',
            secret_key: '',
            webhook_url: '',
            currency: 'USD'
          }
        });

      if (stripeError) throw stripeError;

      // Create PayPal settings
      const { error: paypalError } = await supabase
        .from('payment_settings')
        .insert({
          provider: 'paypal',
          is_enabled: false,
          config: {
            live_mode: false,
            client_id: '',
            client_secret: '',
            webhook_url: '',
            currency: 'USD'
          }
        });

      if (paypalError) throw paypalError;
      
      // Fetch settings after creation
      await fetchPaymentSettings();
    } catch (error: any) {
      console.error('Error creating default settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create default payment settings",
        variant: "destructive",
      });
    }
  };

  const fetchCoinPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('coin_packages')
        .select('*')
        .order('coin_amount', { ascending: true });

      if (error) throw error;
      setCoinPackages(data || []);
      
      if (!data || data.length === 0) {
        // Create some default packages
        await createDefaultCoinPackages();
      }
    } catch (error: any) {
      console.error('Error fetching coin packages:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load coin packages",
        variant: "destructive",
      });
    }
  };

  const createDefaultCoinPackages = async () => {
    const defaultPackages = [
      { name: 'Starter', description: 'Perfect for beginners', coin_amount: 100, price: 4.99, is_featured: false },
      { name: 'Popular', description: 'Best value for most readers', coin_amount: 500, price: 19.99, is_featured: true },
      { name: 'Premium', description: 'For dedicated readers', coin_amount: 1000, price: 34.99, is_featured: false },
    ];

    try {
      for (const pkg of defaultPackages) {
        const { error } = await supabase
          .from('coin_packages')
          .insert({
            ...pkg,
            currency: 'USD',
            is_active: true
          });

        if (error) throw error;
      }

      await fetchCoinPackages();
    } catch (error: any) {
      console.error('Error creating default coin packages:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create default coin packages",
        variant: "destructive",
      });
    }
  };

  const saveStripeSettings = async () => {
    try {
      const stripeProvider = paymentProviders.find(p => p.provider === 'stripe');
      
      if (stripeProvider) {
        const { error } = await supabase
          .from('payment_settings')
          .update({
            is_enabled: stripeEnabled,
            config: stripeSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', stripeProvider.id);

        if (error) throw error;
        
        toast({
          title: "Settings Saved",
          description: "Stripe settings have been updated successfully",
        });
      }
    } catch (error: any) {
      console.error('Error saving Stripe settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save Stripe settings",
        variant: "destructive",
      });
    }
  };

  const savePaypalSettings = async () => {
    try {
      const paypalProvider = paymentProviders.find(p => p.provider === 'paypal');
      
      if (paypalProvider) {
        const { error } = await supabase
          .from('payment_settings')
          .update({
            is_enabled: paypalEnabled,
            config: paypalSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', paypalProvider.id);

        if (error) throw error;
        
        toast({
          title: "Settings Saved",
          description: "PayPal settings have been updated successfully",
        });
      }
    } catch (error: any) {
      console.error('Error saving PayPal settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save PayPal settings",
        variant: "destructive",
      });
    }
  };

  const handleStripeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStripeSettings(prev => ({ ...prev, [name]: value }));
  };

  const handlePaypalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaypalSettings(prev => ({ ...prev, [name]: value }));
  };

  const handlePackageInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price' || name === 'coin_amount') {
      // Convert to number for numeric fields
      setPackageFormData(prev => ({ 
        ...prev, 
        [name]: name === 'price' ? parseFloat(value) : parseInt(value, 10) 
      }));
    } else {
      setPackageFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePackageCheckboxChange = (name: string, checked: boolean) => {
    setPackageFormData(prev => ({ ...prev, [name]: checked }));
  };

  const openPackageDialog = (pkg: CoinPackage | null = null) => {
    if (pkg) {
      // Edit mode
      setPackageFormData({
        name: pkg.name,
        description: pkg.description || '',
        coin_amount: pkg.coin_amount,
        price: pkg.price,
        currency: pkg.currency,
        is_featured: pkg.is_featured,
        is_active: pkg.is_active
      });
      setSelectedPackage(pkg);
    } else {
      // Add mode
      setPackageFormData({
        name: '',
        description: '',
        coin_amount: 100,
        price: 4.99,
        currency: 'USD',
        is_featured: false,
        is_active: true
      });
      setSelectedPackage(null);
    }
    setPackageDialog(true);
  };

  const handleSavePackage = async () => {
    try {
      const { name, coin_amount, price } = packageFormData;
      
      if (!name || coin_amount <= 0 || price <= 0) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields with valid values",
          variant: "destructive",
        });
        return;
      }
      
      if (selectedPackage) {
        // Edit existing package
        const { error } = await supabase
          .from('coin_packages')
          .update({
            ...packageFormData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPackage.id);

        if (error) throw error;
        
        setCoinPackages(coinPackages.map(p => 
          p.id === selectedPackage.id 
            ? { ...p, ...packageFormData, updated_at: new Date().toISOString() } 
            : p
        ));
        
        toast({
          title: "Package Updated",
          description: `"${name}" package has been updated successfully`,
        });
      } else {
        // Add new package
        const { data, error } = await supabase
          .from('coin_packages')
          .insert(packageFormData)
          .select();

        if (error) throw error;
        
        if (data && data[0]) {
          setCoinPackages([...coinPackages, data[0]]);
          toast({
            title: "Package Created",
            description: `"${name}" package has been created successfully`,
          });
        }
      }
      
      setPackageDialog(false);
    } catch (error: any) {
      console.error('Error saving coin package:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save coin package",
        variant: "destructive",
      });
    }
  };

  const confirmDeletePackage = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    setDeletePackageDialog(true);
  };

  const handleDeletePackage = async () => {
    if (!selectedPackage) return;
    
    try {
      const { error } = await supabase
        .from('coin_packages')
        .delete()
        .eq('id', selectedPackage.id);

      if (error) throw error;
      
      setCoinPackages(coinPackages.filter(p => p.id !== selectedPackage.id));
      toast({
        title: "Package Deleted",
        description: `"${selectedPackage.name}" package has been deleted successfully`,
      });
      
      setDeletePackageDialog(false);
      setSelectedPackage(null);
    } catch (error: any) {
      console.error('Error deleting coin package:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete coin package",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Payment Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure payment providers and coin packages for your platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Providers</CardTitle>
              <CardDescription>
                Configure the payment methods for your platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue="stripe" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stripe">Stripe</TabsTrigger>
                  <TabsTrigger value="paypal">PayPal</TabsTrigger>
                </TabsList>
                
                <TabsContent value="stripe" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Stripe</h3>
                      <p className="text-sm text-muted-foreground">
                        Accept credit card payments via Stripe.
                      </p>
                    </div>
                    <Switch 
                      checked={stripeEnabled} 
                      onCheckedChange={setStripeEnabled}
                    />
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <div className="grid gap-1">
                      <label htmlFor="live_mode" className="text-sm font-medium">
                        Mode
                      </label>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="live_mode"
                          checked={stripeSettings.live_mode} 
                          onCheckedChange={(checked) => setStripeSettings(prev => ({ ...prev, live_mode: checked }))}
                        />
                        <span className="text-sm">
                          {stripeSettings.live_mode ? 'Live Mode' : 'Test Mode'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use test mode to test your integration without processing real charges.
                      </p>
                    </div>
                    
                    <div className="grid gap-1">
                      <label htmlFor="api_key" className="text-sm font-medium">
                        Publishable Key {stripeSettings.live_mode ? '(Live)' : '(Test)'}
                      </label>
                      <Input
                        id="api_key"
                        name="api_key"
                        value={stripeSettings.api_key || ''}
                        onChange={handleStripeInputChange}
                        placeholder="pk_test_..."
                      />
                    </div>
                    
                    <div className="grid gap-1">
                      <label htmlFor="secret_key" className="text-sm font-medium">
                        Secret Key {stripeSettings.live_mode ? '(Live)' : '(Test)'}
                      </label>
                      <Input
                        id="secret_key"
                        name="secret_key"
                        type="password"
                        value={stripeSettings.secret_key || ''}
                        onChange={handleStripeInputChange}
                        placeholder="sk_test_..."
                      />
                    </div>
                    
                    <div className="grid gap-1">
                      <label htmlFor="webhook_url" className="text-sm font-medium">
                        Webhook URL
                      </label>
                      <Input
                        id="webhook_url"
                        name="webhook_url"
                        value={stripeSettings.webhook_url || ''}
                        onChange={handleStripeInputChange}
                        placeholder="https://your-site.com/api/webhooks/stripe"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Set this URL in your Stripe dashboard webhook settings.
                      </p>
                    </div>
                    
                    <div className="grid gap-1">
                      <label htmlFor="stripe_currency" className="text-sm font-medium">
                        Currency
                      </label>
                      <Input
                        id="stripe_currency"
                        name="currency"
                        value={stripeSettings.currency || 'USD'}
                        onChange={handleStripeInputChange}
                        placeholder="USD"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Three-letter ISO currency code (e.g., USD, EUR, GBP)
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button onClick={saveStripeSettings}>
                      Save Stripe Settings
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="paypal" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">PayPal</h3>
                      <p className="text-sm text-muted-foreground">
                        Accept payments via PayPal.
                      </p>
                    </div>
                    <Switch 
                      checked={paypalEnabled} 
                      onCheckedChange={setPaypalEnabled}
                    />
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <div className="grid gap-1">
                      <label htmlFor="paypal_live_mode" className="text-sm font-medium">
                        Mode
                      </label>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="paypal_live_mode"
                          checked={paypalSettings.live_mode} 
                          onCheckedChange={(checked) => setPaypalSettings(prev => ({ ...prev, live_mode: checked }))}
                        />
                        <span className="text-sm">
                          {paypalSettings.live_mode ? 'Live Mode' : 'Sandbox Mode'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use sandbox mode to test your integration without processing real transactions.
                      </p>
                    </div>
                    
                    <div className="grid gap-1">
                      <label htmlFor="client_id" className="text-sm font-medium">
                        Client ID {paypalSettings.live_mode ? '(Live)' : '(Sandbox)'}
                      </label>
                      <Input
                        id="client_id"
                        name="client_id"
                        value={paypalSettings.client_id || ''}
                        onChange={handlePaypalInputChange}
                        placeholder="Client ID from PayPal Developer Dashboard"
                      />
                    </div>
                    
                    <div className="grid gap-1">
                      <label htmlFor="client_secret" className="text-sm font-medium">
                        Client Secret {paypalSettings.live_mode ? '(Live)' : '(Sandbox)'}
                      </label>
                      <Input
                        id="client_secret"
                        name="client_secret"
                        type="password"
                        value={paypalSettings.client_secret || ''}
                        onChange={handlePaypalInputChange}
                        placeholder="Client Secret from PayPal Developer Dashboard"
                      />
                    </div>
                    
                    <div className="grid gap-1">
                      <label htmlFor="paypal_webhook_url" className="text-sm font-medium">
                        Webhook URL
                      </label>
                      <Input
                        id="paypal_webhook_url"
                        name="webhook_url"
                        value={paypalSettings.webhook_url || ''}
                        onChange={handlePaypalInputChange}
                        placeholder="https://your-site.com/api/webhooks/paypal"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Set this URL in your PayPal Developer Dashboard webhook settings.
                      </p>
                    </div>
                    
                    <div className="grid gap-1">
                      <label htmlFor="paypal_currency" className="text-sm font-medium">
                        Currency
                      </label>
                      <Input
                        id="paypal_currency"
                        name="currency"
                        value={paypalSettings.currency || 'USD'}
                        onChange={handlePaypalInputChange}
                        placeholder="USD"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Three-letter ISO currency code (e.g., USD, EUR, GBP)
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button onClick={savePaypalSettings}>
                      Save PayPal Settings
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Documentation</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Stripe Integration</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Learn how to set up Stripe for your platform.
                  </p>
                  <Button variant="link" className="px-0 h-auto mt-1">
                    Visit Stripe Docs <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                
                <div>
                  <h3 className="font-medium">PayPal Integration</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Learn how to set up PayPal for your platform.
                  </p>
                  <Button variant="link" className="px-0 h-auto mt-1">
                    Visit PayPal Docs <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                
                <div className="pt-2">
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-3 text-sm flex">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-amber-800 dark:text-amber-300">
                      Never share your API keys publicly. Keep them secure in your environment variables.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Coin Packages</CardTitle>
              <CardDescription>
                Define the coin packages available for purchase.
              </CardDescription>
            </div>
            <Button onClick={() => openPackageDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Package
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Coins</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coinPackages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No coin packages found. Add a package to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  coinPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">
                        {pkg.name}
                        {pkg.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {pkg.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-yellow-500 mr-1" />
                          {pkg.coin_amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        ${pkg.price.toFixed(2)} {pkg.currency}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          pkg.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {pkg.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {pkg.is_featured ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            Featured
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openPackageDialog(pkg)}
                          className="mr-1"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => confirmDeletePackage(pkg)}
                        >
                          <Trash size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t">
            <div className="text-sm text-muted-foreground">
              <CreditCard className="inline-block h-4 w-4 mr-1 mb-0.5" />
              Coin packages will be displayed on the purchase coins page.
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Add/Edit Package Dialog */}
      <Dialog open={packageDialog} onOpenChange={setPackageDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedPackage ? 'Edit Package' : 'Add New Package'}</DialogTitle>
            <DialogDescription>
              {selectedPackage 
                ? 'Update the details for this coin package.' 
                : 'Create a new coin package that users can purchase.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Package Name
              </label>
              <Input
                id="name"
                name="name"
                value={packageFormData.name}
                onChange={handlePackageInputChange}
                placeholder="e.g., Starter Pack"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                name="description"
                value={packageFormData.description}
                onChange={handlePackageInputChange}
                placeholder="e.g., Perfect for new readers"
                className="resize-none"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="coin_amount" className="text-sm font-medium">
                  Coin Amount
                </label>
                <Input
                  id="coin_amount"
                  name="coin_amount"
                  type="number"
                  min="1"
                  value={packageFormData.coin_amount}
                  onChange={handlePackageInputChange}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="price" className="text-sm font-medium">
                  Price
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={packageFormData.price}
                  onChange={handlePackageInputChange}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="currency" className="text-sm font-medium">
                Currency
              </label>
              <Input
                id="currency"
                name="currency"
                value={packageFormData.currency}
                onChange={handlePackageInputChange}
                placeholder="USD"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Three-letter ISO currency code (e.g., USD, EUR, GBP)
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is_featured"
                  checked={packageFormData.is_featured}
                  onCheckedChange={(checked) => handlePackageCheckboxChange('is_featured', checked)}
                />
                <label htmlFor="is_featured" className="text-sm font-medium">
                  Featured Package
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is_active"
                  checked={packageFormData.is_active}
                  onCheckedChange={(checked) => handlePackageCheckboxChange('is_active', checked)}
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePackage}>
              {selectedPackage ? 'Save Changes' : 'Create Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Package Dialog */}
      <Dialog open={deletePackageDialog} onOpenChange={setDeletePackageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete the "{selectedPackage?.name}" package? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePackageDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePackage}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentSettings;
