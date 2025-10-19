import React, { useCallback, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';

interface PlaidLinkProps {
  onSuccess?: (publicToken: string, metadata: any) => void;
  onExit?: (error: any, metadata: any) => void;
  className?: string;
}

interface ConnectedAccount {
  id: string;
  name: string;
  type: string;
  subtype: string;
  mask: string;
  balance?: number;
  status: 'connected' | 'error' | 'updating';
}

export function PlaidLink({ onSuccess, onExit, className = '' }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true); // Demo mode until backend is ready
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([
    // Mock data - you'll replace this with real data from your backend
    {
      id: '1',
      name: 'Chase College Checking',
      type: 'depository',
      subtype: 'checking',
      mask: '0000',
      balance: 1247.83,
      status: 'connected'
    },
    {
      id: '2', 
      name: 'Discover Student Card',
      type: 'credit',
      subtype: 'credit card',
      mask: '1234',
      balance: -342.15,
      status: 'connected'
    }
  ]);

  // Initialize Plaid Link only when not in demo mode and token exists
  const config = {
    token: linkToken,
    onSuccess: useCallback((publicToken: string, metadata: any) => {
      console.log('Plaid Link Success:', { publicToken, metadata });
      // You'll send this to your backend to exchange for access token
      onSuccess?.(publicToken, metadata);
      
      // Mock adding a new account
      const newAccount: ConnectedAccount = {
        id: Date.now().toString(),
        name: metadata.institution?.name || 'New Account',
        type: metadata.accounts?.[0]?.type || 'depository',
        subtype: metadata.accounts?.[0]?.subtype || 'checking',
        mask: metadata.accounts?.[0]?.mask || '0000',
        status: 'updating'
      };
      
      setConnectedAccounts(prev => [...prev, newAccount]);
      
      // Simulate account sync
      setTimeout(() => {
        setConnectedAccounts(prev => 
          prev.map(acc => 
            acc.id === newAccount.id 
              ? { ...acc, status: 'connected' as const, balance: Math.random() * 2000 }
              : acc
          )
        );
      }, 2000);
    }, [onSuccess]),
    onExit: useCallback((error: any, metadata: any) => {
      console.log('Plaid Link Exit:', { error, metadata });
      onExit?.(error, metadata);
    }, [onExit]),
  };

  // Only initialize Plaid Link if we have a valid token and not in demo mode
  const { open } = usePlaidLink(!isDemoMode && linkToken ? config : {
    token: null,
    onSuccess: () => {},
    onExit: () => {}
  });

  // Function to create link token (you'll implement this in your backend)
  const createLinkToken = async () => {
    setIsLoading(true);
    try {
      // This would be a call to your backend endpoint
      // const response = await fetch('/api/plaid/create-link-token', { method: 'POST' });
      // const data = await response.json();
      // setLinkToken(data.link_token);
      
      // Mock link token for demo
      setTimeout(() => {
        setLinkToken('mock-link-token');
        setIsLoading(false);
        open();
      }, 1000);
    } catch (error) {
      console.error('Error creating link token:', error);
      setIsLoading(false);
    }
  };

  const handleConnectAccount = () => {
    if (isDemoMode) {
      // Demo mode - simulate adding an account
      setIsLoading(true);
      
      const demoAccounts = [
        { name: 'Wells Fargo Student Checking', type: 'depository', subtype: 'checking', mask: '5678' },
        { name: 'Capital One Venture Card', type: 'credit', subtype: 'credit card', mask: '9012' },
        { name: 'Bank of America Savings', type: 'depository', subtype: 'savings', mask: '3456' },
        { name: 'Citi Double Cash Card', type: 'credit', subtype: 'credit card', mask: '7890' }
      ];
      
      const randomAccount = demoAccounts[Math.floor(Math.random() * demoAccounts.length)];
      
      setTimeout(() => {
        const newAccount: ConnectedAccount = {
          id: Date.now().toString(),
          name: randomAccount.name,
          type: randomAccount.type as any,
          subtype: randomAccount.subtype,
          mask: randomAccount.mask,
          status: 'updating'
        };
        
        setConnectedAccounts(prev => [...prev, newAccount]);
        setIsLoading(false);
        
        // Simulate account sync
        setTimeout(() => {
          setConnectedAccounts(prev => 
            prev.map(acc => 
              acc.id === newAccount.id 
                ? { 
                    ...acc, 
                    status: 'connected' as const, 
                    balance: randomAccount.type === 'credit' 
                      ? -(Math.random() * 500) 
                      : Math.random() * 3000 
                  }
                : acc
            )
          );
        }, 2000);
      }, 1500);
    } else {
      // Real Plaid mode
      if (linkToken) {
        open();
      } else {
        createLinkToken();
      }
    }
  };

  const handleDisconnectAccount = (accountId: string) => {
    setConnectedAccounts(prev => prev.filter(acc => acc.id !== accountId));
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return CreditCard;
      case 'depository':
        return Building2;
      default:
        return CreditCard;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'updating':
        return Loader2;
      default:
        return CheckCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'updating':
        return 'text-secondary';
      default:
        return 'text-green-500';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-foreground text-lg font-semibold mb-1">Connected Accounts</h3>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">Manage your bank accounts and credit cards</p>
            {isDemoMode && (
              <Badge variant="outline" className="text-xs border-secondary/30 text-secondary">
                Demo Mode
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDemoMode(false)}
              className="border-secondary/30 text-secondary hover:bg-secondary/10"
            >
              Enable Real Plaid
            </Button>
          )}
          <Button
            onClick={handleConnectAccount}
            disabled={isLoading}
            className="gradient-maroon glow-maroon hover:opacity-90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Connecting...' : 'Add Account'}
          </Button>
        </div>
      </div>

      {/* Connected Accounts List */}
      <div className="space-y-3">
        {connectedAccounts.map((account, index) => {
          const AccountIcon = getAccountIcon(account.type);
          const StatusIcon = getStatusIcon(account.status);
          
          return (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-maroon glow-maroon flex items-center justify-center">
                    <AccountIcon className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-foreground font-medium">{account.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        •••• {account.mask}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusIcon 
                        className={`w-4 h-4 ${getStatusColor(account.status)} ${
                          account.status === 'updating' ? 'animate-spin' : ''
                        }`} 
                      />
                      <span className="text-muted-foreground text-sm capitalize">
                        {account.status === 'updating' ? 'Syncing...' : account.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {account.balance !== undefined && (
                    <div className="text-right">
                      <p className={`font-semibold ${
                        account.balance >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        ${Math.abs(account.balance).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {account.type === 'credit' ? 'Balance' : 'Available'}
                      </p>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnectAccount(account.id)}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {connectedAccounts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl gradient-maroon glow-maroon flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="text-foreground mb-2">No accounts connected</h3>
          <p className="text-muted-foreground mb-6">
            Connect your bank accounts to automatically track your spending and budget
          </p>
          <Button
            onClick={handleConnectAccount}
            disabled={isLoading}
            className="gradient-maroon glow-maroon hover:opacity-90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Connecting...' : 'Connect Your First Account'}
          </Button>
        </motion.div>
      )}

      {/* Security Notice */}
      <div className="glass-card p-4 rounded-xl border border-secondary/20">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-foreground font-medium mb-1">
              {isDemoMode ? 'Demo Mode Active' : 'Bank-level Security'}
            </h4>
            <p className="text-muted-foreground text-sm">
              {isDemoMode 
                ? 'Currently in demo mode with simulated accounts. Enable "Real Plaid" to connect actual bank accounts with bank-level security.'
                : 'Your financial data is protected with 256-bit encryption and never stored on our servers. We use Plaid\'s secure infrastructure trusted by thousands of financial institutions.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
