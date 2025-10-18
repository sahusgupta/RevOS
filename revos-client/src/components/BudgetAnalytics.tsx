import { GlassPanel } from './GlassPanel';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { DollarSign, TrendingDown, TrendingUp, PieChart, ShoppingCart, Coffee, Home, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function BudgetAnalytics() {
  const monthlyData = [
    { month: 'Aug', spent: 850, budget: 1000 },
    { month: 'Sep', spent: 920, budget: 1000 },
    { month: 'Oct', spent: 658, budget: 1000 },
  ];

  const categoryData = [
    { name: 'Groceries', value: 280, icon: ShoppingCart, color: '#500000' },
    { name: 'Dining Out', value: 185, icon: Coffee, color: '#CFAF5A' },
    { name: 'Housing', value: 120, icon: Home, color: '#800020' },
    { name: 'Utilities', value: 73, icon: Zap, color: '#d4a661' },
  ];

  const weeklySpending = [
    { week: 'Week 1', amount: 145 },
    { week: 'Week 2', amount: 198 },
    { week: 'Week 3', amount: 167 },
    { week: 'Week 4', amount: 148 },
  ];

  const recentTransactions = [
    { id: 1, name: 'HEB Groceries', amount: 47.23, category: 'Groceries', date: 'Oct 18' },
    { id: 2, name: 'Northgate Bar & Grill', amount: 32.15, category: 'Dining', date: 'Oct 17' },
    { id: 3, name: 'MSC Bookstore', amount: 89.99, category: 'Textbooks', date: 'Oct 16' },
    { id: 4, name: 'Starbucks', amount: 5.75, category: 'Coffee', date: 'Oct 15' },
    { id: 5, name: 'Amazon', amount: 28.44, category: 'Shopping', date: 'Oct 14' },
  ];

  const budgetCategories = [
    { category: 'Groceries', spent: 280, budget: 350, icon: ShoppingCart },
    { category: 'Dining Out', spent: 185, budget: 200, icon: Coffee },
    { category: 'Entertainment', spent: 48, budget: 100, icon: PieChart },
    { category: 'Transportation', spent: 92, budget: 150, icon: Home },
  ];

  const totalSpent = categoryData.reduce((sum, cat) => sum + cat.value, 0);
  const totalBudget = 1000;
  const remaining = totalBudget - totalSpent;
  const percentUsed = (totalSpent / totalBudget) * 100;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-white mb-2">Budget Analytics</h1>
          <p className="text-white/60">Track your spending and stay on budget this semester</p>
        </div>
        <Badge className="bg-[#CFAF5A] text-[#500000] px-4 py-2">October 2025</Badge>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
        >
          <GlassPanel glow="maroon" className="text-center">
            <DollarSign className="w-8 h-8 text-[#CFAF5A] mx-auto mb-2" />
            <p className="text-white/60 mb-1">Total Budget</p>
            <h2 className="text-white">${totalBudget}</h2>
          </GlassPanel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
        >
          <GlassPanel className="text-center">
            <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-white/60 mb-1">Spent</p>
            <h2 className="text-white">${totalSpent}</h2>
            <p className="text-red-400">{percentUsed.toFixed(1)}% used</p>
          </GlassPanel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <GlassPanel className="text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-white/60 mb-1">Remaining</p>
            <h2 className="text-white">${remaining}</h2>
            <p className="text-green-400">{(100 - percentUsed).toFixed(1)}% left</p>
          </GlassPanel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
        >
          <GlassPanel glow="gold" className="text-center">
            <PieChart className="w-8 h-8 text-[#CFAF5A] mx-auto mb-2" />
            <p className="text-white/60 mb-1">Avg Daily</p>
            <h2 className="text-white">${(totalSpent / 18).toFixed(2)}</h2>
            <p className="text-[#CFAF5A]">This month</p>
          </GlassPanel>
        </motion.div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <GlassPanel>
          <h3 className="text-white mb-6">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RePieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(207, 175, 90, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
            </RePieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {categoryData.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-2 p-2 rounded-lg glass-card"
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <Icon className="w-4 h-4 text-[#CFAF5A]" />
                  <div className="flex-1">
                    <p className="text-white">{cat.name}</p>
                    <p className="text-[#CFAF5A]">${cat.value}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassPanel>

        {/* Monthly Trends */}
        <GlassPanel>
          <h3 className="text-white mb-6">Monthly Spending Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#ffffff80" />
              <YAxis stroke="#ffffff80" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(207, 175, 90, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Bar dataKey="spent" fill="#500000" radius={[8, 8, 0, 0]} />
              <Bar dataKey="budget" fill="#CFAF5A" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#500000]" />
              <span className="text-white/60">Spent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#CFAF5A]" />
              <span className="text-white/60">Budget</span>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Budget Categories Progress */}
      <GlassPanel>
        <h3 className="text-white mb-6">Budget Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgetCategories.map((cat, index) => {
            const Icon = cat.icon;
            const percentage = (cat.spent / cat.budget) * 100;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-[#CFAF5A]" />
                    <span className="text-white">{cat.category}</span>
                  </div>
                  <span className="text-[#CFAF5A]">
                    ${cat.spent} / ${cat.budget}
                  </span>
                </div>
                <Progress value={percentage} className="h-2 bg-white/10" />
                <p className={`${percentage > 90 ? 'text-red-400' : 'text-white/60'}`}>
                  {percentage > 90 ? '⚠️ ' : ''}
                  {percentage.toFixed(0)}% used
                </p>
              </motion.div>
            );
          })}
        </div>
      </GlassPanel>

      {/* Weekly Spending & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Spending */}
        <GlassPanel>
          <h3 className="text-white mb-6">Weekly Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklySpending}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="week" stroke="#ffffff80" />
              <YAxis stroke="#ffffff80" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(207, 175, 90, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#CFAF5A"
                strokeWidth={3}
                dot={{ fill: '#500000', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassPanel>

        {/* Recent Transactions */}
        <GlassPanel>
          <h3 className="text-white mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {recentTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-center justify-between p-3 rounded-lg glass-card cursor-pointer"
              >
                <div className="flex-1">
                  <p className="text-white">{transaction.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="border-[#CFAF5A]/30 text-[#CFAF5A]">
                      {transaction.category}
                    </Badge>
                    <span className="text-white/40">{transaction.date}</span>
                  </div>
                </div>
                <span className="text-white ml-4">${transaction.amount.toFixed(2)}</span>
              </motion.div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <GlassPanel glow="gold" className="gradient-maroon">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#CFAF5A] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-[#500000]" />
            </div>
            <div className="flex-1">
              <h3 className="text-white mb-2">💡 Rev's Budget Insights</h3>
              <p className="text-white/80 mb-4">
                You're doing great this month! You're spending 8% more on dining out compared to last month. 
                Consider meal prepping to save $50-75. You're on track to end the month under budget by $342.
              </p>
              <div className="flex gap-2">
                <Badge className="bg-green-500/20 text-green-400">On Track</Badge>
                <Badge className="bg-[#CFAF5A]/20 text-[#CFAF5A]">Savings Goal: 15%</Badge>
              </div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
