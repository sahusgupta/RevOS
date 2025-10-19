import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GlassPanel } from './GlassPanel';
import { PlaidLink } from './PlaidLink';
import { Button } from './ui/button';
import { PlaidService, Transaction, LinkedAccount } from '../services/plaid';

interface BudgetAnalyticsProps {
  authToken: string;
  userId: string;
}

export function BudgetAnalytics({ authToken, userId }: BudgetAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'transactions'>('overview');
  const [selectedAccount, setSelectedAccount] = useState<LinkedAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load transactions when component mounts or account changes
  useEffect(() => {
    if (selectedAccount) {
      loadTransactions();
    }
  }, [selectedAccount]);

  // Load transactions from PlaidService
  const loadTransactions = async () => {
    if (!selectedAccount) {
      setTransactions([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get transactions for the selected account
      const txns = await PlaidService.getTransactions(
        selectedAccount.id,
        authToken,
        'http://localhost:5000'
      );
      setTransactions(txns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      console.error('❌ Error loading transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate insights from transactions
  const insights = transactions.length > 0 ? PlaidService.calculateSpendingInsights(transactions) : null;

  // Prepare chart data
  const monthlyData = [
    { name: 'Oct 15', spending: 234, budget: 500 },
    { name: 'Oct 16', spending: 342, budget: 500 },
    { name: 'Oct 17', spending: 189, budget: 500 },
    { name: 'Oct 18', spending: 421, budget: 500 },
    { name: 'Oct 19', spending: 156, budget: 500 },
  ];

  const categoryData = insights?.top_categories || [];

  const COLORS = ['#500000', '#8B0000', '#CFAF5A', '#d4a661', '#A0522D'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-foreground text-2xl font-bold mb-2">Budget & Spending</h1>
          <p className="text-foreground/60">Track your finances and connect your bank accounts</p>
        </div>
        <Button
          onClick={loadTransactions}
          disabled={isLoading}
          className="bg-[#500000] hover:bg-[#8B0000]"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Refresh'}
        </Button>
      </motion.div>

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

      {/* Selected Account Info */}
      {selectedAccount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassPanel className="p-4 bg-gradient-to-r from-[#500000]/10 to-[#8B0000]/10 border border-[#500000]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/60 text-sm">Selected Account</p>
                <h3 className="text-foreground font-semibold mt-1">{selectedAccount.institution_name}</h3>
                {selectedAccount.accounts.length > 0 && (
                  <p className="text-foreground/70 text-sm mt-1">
                    {selectedAccount.accounts[0].name} •••{selectedAccount.accounts[0].mask}
                  </p>
                )}
              </div>
              {selectedAccount.accounts.length > 0 && selectedAccount.accounts[0].balance && (
                <div className="text-right">
                  <p className="text-foreground/60 text-sm">Current Balance</p>
                  <p className="text-2xl font-bold text-[#CFAF5A] mt-1">
                    ${selectedAccount.accounts[0].balance.current.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-foreground/10">
        {(['overview', 'accounts', 'transactions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-[#500000] text-foreground'
                : 'border-transparent text-foreground/60 hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {insights && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <GlassPanel className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground/60 text-sm">Total Spending</p>
                      <p className="text-2xl font-bold text-secondary mt-1">
                        ${insights.summary.total_spending.toFixed(2)}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
                  </div>
                </GlassPanel>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <GlassPanel className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground/60 text-sm">Daily Average</p>
                      <p className="text-2xl font-bold text-secondary mt-1">
                        ${insights.summary.daily_average.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-[#CFAF5A] opacity-50" />
                  </div>
                </GlassPanel>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <GlassPanel className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground/60 text-sm">Monthly Average</p>
                      <p className="text-2xl font-bold text-secondary mt-1">
                        ${insights.summary.monthly_average.toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </GlassPanel>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <GlassPanel className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground/60 text-sm">Transactions</p>
                      <p className="text-2xl font-bold text-secondary mt-1">
                        {insights.summary.transaction_count}
                      </p>
                    </div>
                    <PieChartIcon className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </GlassPanel>
              </motion.div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Spending Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <GlassPanel className="p-6">
                <h3 className="text-foreground font-semibold mb-4">Daily Spending</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid #500000',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="spending" stroke="#500000" strokeWidth={2} dot={{ fill: '#500000' }} />
                    <Line type="monotone" dataKey="budget" stroke="#CFAF5A" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </GlassPanel>
            </motion.div>

            {/* Category Breakdown */}
            {categoryData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <GlassPanel className="p-6">
                  <h3 className="text-foreground font-semibold mb-4">Top Categories</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => {
                          if (typeof value === 'number') {
                            return `$${value.toFixed(2)}`;
                          }
                          const num = Number(value);
                          if (!isNaN(num)) {
                            return `$${num.toFixed(2)}`;
                          }
                          return value;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </GlassPanel>
              </motion.div>
            )}
          </div>

          {/* Recommendations */}
          {insights && insights.recommendations.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <GlassPanel className="p-6 border-[#CFAF5A]/30">
                <h3 className="text-foreground font-semibold mb-4">💡 Recommendations</h3>
                <div className="space-y-2">
                  {insights.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-secondary font-bold">•</span>
                      <p className="text-foreground/80">{rec}</p>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <PlaidLink 
            authToken={authToken} 
            userId={userId}
            onAccountSelected={(account) => setSelectedAccount(account)}
          />
        </motion.div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GlassPanel className="p-6">
            <h3 className="text-foreground font-semibold mb-4">Recent Transactions</h3>
            {transactions.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {transactions.map(txn => (
                  <div key={txn.transaction_id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{txn.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-foreground/60 text-sm">{txn.date}</p>
                        <span className="text-foreground/40 text-xs">{txn.category?.[0] || 'Other'}</span>
                      </div>
                    </div>
                    <p className="text-foreground font-semibold">-${txn.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground/60 text-center py-8">No transactions loaded. Link an account to view transactions.</p>
            )}
          </GlassPanel>
        </motion.div>
      )}
    </div>
  );
}
