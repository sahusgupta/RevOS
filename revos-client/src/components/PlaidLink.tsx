import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { usePlaidLink } from 'react-plaid-link';
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from './ui/button';
import { GlassPanel } from './GlassPanel';
import { PlaidService, LinkedAccount } from '../services/plaid';

interface PlaidLinkProps {
  authToken: string;
  userId: string;
  onAccountLinked?: (account: LinkedAccount) => void;
  onAccountSelected?: (account: LinkedAccount) => void;
}

export function PlaidLink({ authToken, userId, onAccountLinked, onAccountSelected }: PlaidLinkProps) {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleBalances, setVisibleBalances] = useState<Set<string>>(new Set());

  // Load linked accounts from localStorage on mount
  useEffect(() => {
    const accounts = PlaidService.getLinkedAccounts();
    setLinkedAccounts(accounts);
  }, []);

  // Create Plaid Link token
  const createLinkToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await PlaidService.createLinkToken(userId, authToken);
      setLinkToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link token');
      console.error('❌ Error creating link token:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, authToken]);

  // Handle successful Plaid Link
  const handlePlaidSuccess = useCallback(
    (publicToken: string, metadata: any) => {
      try {
        // Generate realistic varying balances for demo accounts
        const generateBalance = () => Math.floor(Math.random() * 50000) + 1000; // $1,000 - $51,000
        
        // Create account entry from metadata
        const newAccount: LinkedAccount = {
          id: metadata.account?.id || `account_${Date.now()}`,
          institution_name: metadata.institution?.name || 'Unknown Bank',
          institution_id: metadata.institution?.institution_id || '',
          accounts: metadata.accounts?.map((acc: any) => ({
            id: acc.id,
            name: acc.name,
            type: acc.type,
            subtype: acc.subtype,
            mask: acc.mask,
            balance: {
              available: generateBalance(),
              current: generateBalance(),
              limit: acc.balances?.limit,
            },
          })) || [],
          access_token: publicToken,
          public_token: publicToken,
        };

        // Save to localStorage
        PlaidService.saveLinkedAccount(newAccount);
        
        // Update state
        setLinkedAccounts(prev => [...prev, newAccount]);
        setLinkToken(null);

        // Call parent callback
        if (onAccountLinked) {
          onAccountLinked(newAccount);
        }

        console.log('✅ Account linked successfully:', newAccount);
      } catch (err) {
        setError('Failed to link account. Please try again.');
        console.error('❌ Error handling Plaid success:', err);
      }
    },
    [onAccountLinked]
  );

  // Handle Plaid Link close
  const handlePlaidExit = useCallback(() => {
    setLinkToken(null);
    setError(null);
  }, []);

  // Initialize Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: handlePlaidSuccess,
    onExit: handlePlaidExit,
  });

  // Open Plaid Link when token is ready
  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  // Disconnect account
  const handleDisconnectAccount = (accountId: string) => {
    try {
      PlaidService.removeLinkedAccount(accountId);
      setLinkedAccounts(prev => prev.filter(a => a.id !== accountId));
      console.log('✅ Account disconnected');
    } catch (err) {
      setError('Failed to disconnect account');
      console.error('❌ Error disconnecting:', err);
    }
  };

  // Toggle balance visibility
  const toggleBalance = (accountId: string) => {
    setVisibleBalances(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  // Handle account selection
  const handleSelectAccount = (account: LinkedAccount) => {
    setSelectedAccountId(account.id);
    if (onAccountSelected) {
      onAccountSelected(account);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassPanel className="p-4 border-red-600/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-foreground/80">{error}</p>
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {/* Link Button */}
      <Button
        onClick={createLinkToken}
        disabled={isLoading}
        className="w-full bg-[#500000] hover:bg-[#8B0000] text-white"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating connection...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Link Bank Account
          </>
        )}
      </Button>

      {/* Linked Accounts */}
      {linkedAccounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-foreground font-semibold">Connected Accounts</h3>
          {linkedAccounts.map(account => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                className="cursor-pointer rounded-lg transition-all"
                onClick={() => handleSelectAccount(account)}
                style={{
                  border: selectedAccountId === account.id ? '2px solid #500000' : '1px solid transparent',
                }}
              >
                <GlassPanel className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#500000] to-[#8B0000] flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-foreground font-semibold">
                          {account.institution_name}
                        </h4>
                        <div className="space-y-2 mt-2">
                          {account.accounts.map(acc => (
                            <div key={acc.id} className="text-sm">
                              <p className="text-foreground/70">{acc.name}</p>
                              {acc.balance && (
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-foreground/60">
                                    {acc.mask && `•••${acc.mask}`}
                                  </p>
                                  <p className="text-foreground/80 font-semibold">
                                    {visibleBalances.has(acc.id)
                                      ? `$${acc.balance.current.toFixed(2)}`
                                      : '••••••'}
                                  </p>
                                  <button
                                    onClick={() => toggleBalance(acc.id)}
                                    className="text-foreground/60 hover:text-foreground transition-colors"
                                  >
                                    {visibleBalances.has(acc.id) ? (
                                      <Eye className="w-4 h-4" />
                                    ) : (
                                      <EyeOff className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnectAccount(account.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </GlassPanel>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {linkedAccounts.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <GlassPanel className="p-8 text-center">
            <Building2 className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
            <p className="text-foreground/60">No accounts linked yet</p>
            <p className="text-foreground/40 text-sm mt-1">
              Click the button above to connect your bank account
            </p>
          </GlassPanel>
        </motion.div>
      )}

      {/* Security Notice */}
      <div className="text-xs text-foreground/50 text-center">
        🔒 Your financial data is stored securely in your browser
      </div>
    </div>
  );
}
