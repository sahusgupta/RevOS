import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter,
  Download,
  AlertCircle,
  DollarSign,
  ShoppingCart,
  Coffee,
  Home,
  Zap,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { GlassPanel } from './GlassPanel';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Transaction {
  transaction_id: string;
  name: string;
  amount: number;
  date: string;
  category: string[];
  merchant_name: string;
  pending: boolean;
}

interface SpendingInsights {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  summary: {
    total_spending: number;
    daily_average: number;
    monthly_average: number;
    transaction_count: number;
  };
  top_categories: Array<{
    category: string;
    amount: number;
    percentage: number;
    transaction_count: number;
  }>;
  recommendations: string[];
}

interface TransactionsViewProps {
  authToken: string;
  apiBaseUrl?: string;
}

export function TransactionsView({ authToken, apiBaseUrl = 'http://localhost:5000' }: TransactionsViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('30days');

  useEffect(() => {
    fetchData();
  }, [dateFilter, authToken]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };

      // Fetch transactions
      const transRes = await fetch(`${apiBaseUrl}/api/plaid/transactions?limit=100`, {
        headers,
      });

      if (!transRes.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const transData = await transRes.json();
      setTransactions(transData.transactions || []);

      // Fetch insights
      const insightsRes = await fetch(`${apiBaseUrl}/api/plaid/spending-insights`, {
        headers,
      });

      if (!insightsRes.ok) {
        throw new Error('Failed to fetch spending insights');
      }

      const insightsData = await insightsRes.json();
      setInsights(insightsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('food') || categoryLower.includes('dining') || categoryLower.includes('coffee')) {
      return <Coffee className="w-4 h-4" />;
    }
    if (categoryLower.includes('shopping') || categoryLower.includes('retail')) {
      return <ShoppingCart className="w-4 h-4" />;
    }
    if (categoryLower.includes('home') || categoryLower.includes('rent') || categoryLower.includes('utility')) {
      return <Home className="w-4 h-4" />;
    }
    if (categoryLower.includes('energy') || categoryLower.includes('electric')) {
      return <Zap className="w-4 h-4" />;
    }
    return <DollarSign className="w-4 h-4" />;
  };

  const COLORS = ['#500000', '#8B0000', '#CFAF5A', '#d4a661', '#A0522D', '#CD5C5C'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <GlassPanel className="p-6 border-red-600/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-foreground font-semibold mb-1">Error</h3>
            <p className="text-foreground/60">{error}</p>
          </div>
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-foreground text-2xl font-bold mb-2">Transactions & Insights</h1>
          <p className="text-foreground/60">Track your spending and get personalized insights</p>
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          className="bg-[#500000] hover:bg-[#8B0000]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </motion.div>

      {/* Summary Cards */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassPanel className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground/60 text-sm">Transactions</p>
                  <p className="text-2xl font-bold text-secondary mt-1">
                    {insights.summary.transaction_count}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        {insights && insights.top_categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassPanel className="p-6">
              <h3 className="text-foreground font-semibold mb-4">Top Spending Categories</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={insights.top_categories}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {insights.top_categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => {
                      if (typeof value === "number") {
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

        {/* Category Breakdown */}
        {insights && insights.top_categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <GlassPanel className="p-6">
              <h3 className="text-foreground font-semibold mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                {insights.top_categories.map((category, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-foreground text-sm">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground font-semibold">${category.amount.toFixed(2)}</p>
                      <p className="text-foreground/60 text-xs">{category.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </div>

      {/* Recommendations */}
      {insights && insights.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <GlassPanel className="p-6 border-[#CFAF5A]/30">
            <h3 className="text-foreground font-semibold mb-4">💡 Smart Recommendations</h3>
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

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <GlassPanel className="p-6">
          <h3 className="text-foreground font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {transactions.length > 0 ? (
              transactions.map((transaction, idx) => (
                <div key={transaction.transaction_id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#500000] to-[#8B0000] flex items-center justify-center">
                      {getCategoryIcon(transaction.category?.[0] || '')}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{transaction.name}</p>
                      <p className="text-foreground/60 text-sm">{transaction.date}</p>
                    </div>
                  </div>
                  <p className="text-foreground font-semibold">-${transaction.amount.toFixed(2)}</p>
                </div>
              ))
            ) : (
              <p className="text-foreground/60 text-center py-8">No transactions found</p>
            )}
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
