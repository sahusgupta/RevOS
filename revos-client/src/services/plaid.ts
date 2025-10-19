/**
 * Frontend Plaid Integration Service
 * Handles all Plaid functionality directly in React
 * No backend Plaid endpoints needed
 */

// Types
export interface PlaidAccount {
  id: string;
  name: string;
  type: string;
  subtype: string;
  mask: string;
  balance?: {
    available: number;
    current: number;
    limit?: number;
  };
}

export interface Transaction {
  transaction_id: string;
  name: string;
  amount: number;
  date: string;
  category: string[];
  merchant_name?: string;
  pending: boolean;
}

export interface SpendingInsights {
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

export interface LinkedAccount {
  id: string;
  institution_name: string;
  institution_id: string;
  accounts: PlaidAccount[];
  public_token?: string;
  access_token: string;
}

/**
 * PlaidService - All Plaid operations in React
 */
export class PlaidService {
  private static readonly STORAGE_KEY = 'plaid_linked_accounts';
  private static readonly TRANSACTIONS_KEY = 'plaid_transactions';
  private static readonly INSIGHTS_KEY = 'plaid_spending_insights';

  /**
   * Get Plaid Link token from backend
   * This is the only backend call needed
   */
  static async createLinkToken(userId: string, authToken: string): Promise<string> {
    try {
      const response = await fetch('http://localhost:5000/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create link token');
      }

      const data = await response.json();
      return data.link_token;
    } catch (error) {
      console.error('❌ Error creating link token:', error);
      throw error;
    }
  }

  /**
   * Save linked account to localStorage
   * In production, you'd send this to backend to store encrypted
   */
  static saveLinkedAccount(account: LinkedAccount): void {
    try {
      const accounts = this.getLinkedAccounts();
      const existingIndex = accounts.findIndex(a => a.id === account.id);
      
      if (existingIndex >= 0) {
        accounts[existingIndex] = account;
      } else {
        accounts.push(account);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(accounts));
      console.log('✅ Account saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving account:', error);
      throw error;
    }
  }

  /**
   * Get all linked accounts from localStorage
   */
  static getLinkedAccounts(): LinkedAccount[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error retrieving accounts:', error);
      return [];
    }
  }

  /**
   * Remove a linked account
   */
  static removeLinkedAccount(accountId: string): void {
    try {
      const accounts = this.getLinkedAccounts();
      const filtered = accounts.filter(a => a.id !== accountId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      console.log('✅ Account removed');
    } catch (error) {
      console.error('❌ Error removing account:', error);
      throw error;
    }
  }

  /**
   * Get transactions from Plaid API via backend
   * Fetches real transaction data for the selected account
   */
  static async getTransactions(
    accountId: string,
    authToken?: string,
    apiBaseUrl: string = 'http://localhost:5000'
  ): Promise<Transaction[]> {
    try {
      if (!authToken) {
        console.warn('⚠️ No auth token provided, returning empty transactions');
        return [];
      }

      // Get the account to retrieve its access_token
      const accounts = this.getLinkedAccounts();
      const account = accounts.find(a => a.id === accountId);
      
      if (!account || !account.access_token) {
        console.warn('⚠️ Account or access_token not found');
        return [];
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90); // Last 90 days
      const endDate = new Date();

      const response = await fetch(
        `${apiBaseUrl}/api/plaid/transactions?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}&limit=100&access_token=${encodeURIComponent(account.access_token)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();
      const transactions = data.transactions || [];

      localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
      return transactions;
    } catch (error) {
      console.error('❌ Error getting transactions:', error);
      return [];
    }
  }

  /**
   * Calculate spending insights from transactions
   */
  static calculateSpendingInsights(transactions: Transaction[]): SpendingInsights {
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      // Group by category
      const byCategory: { [key: string]: { total: number; count: number } } = {};
      
      transactions.forEach(txn => {
        const category = txn.category?.[0] || 'Other';
        if (!byCategory[category]) {
          byCategory[category] = { total: 0, count: 0 };
        }
        byCategory[category].total += txn.amount;
        byCategory[category].count += 1;
      });

      // Sort by total spending
      const sortedCategories = Object.entries(byCategory)
        .map(([name, data]) => ({
          category: name,
          amount: data.total,
          count: data.count,
        }))
        .sort((a, b) => b.amount - a.amount);

      const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
      
      const insights: SpendingInsights = {
        period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0],
          days: 90,
        },
        summary: {
          total_spending: totalSpending,
          daily_average: totalSpending / 90,
          monthly_average: totalSpending / 3,
          transaction_count: transactions.length,
        },
        top_categories: sortedCategories.slice(0, 5).map(cat => ({
          category: cat.category,
          amount: cat.amount,
          percentage: (cat.amount / totalSpending) * 100,
          transaction_count: cat.count,
        })),
        recommendations: this.generateRecommendations(byCategory, totalSpending),
      };

      localStorage.setItem(this.INSIGHTS_KEY, JSON.stringify(insights));
      return insights;
    } catch (error) {
      console.error('❌ Error calculating insights:', error);
      return {
        period: { start_date: '', end_date: '', days: 0 },
        summary: { total_spending: 0, daily_average: 0, monthly_average: 0, transaction_count: 0 },
        top_categories: [],
        recommendations: [],
      };
    }
  }

  /**
   * Generate personalized spending recommendations
   */
  private static generateRecommendations(
    byCategory: { [key: string]: { total: number; count: number } },
    totalSpending: number
  ): string[] {
    const recommendations: string[] = [];

    // Check for high food spending
    const foodCategories = Object.entries(byCategory).filter(
      ([name]) => name.toLowerCase().includes('food') || name.toLowerCase().includes('dining')
    );
    const foodTotal = foodCategories.reduce((sum, [_, data]) => sum + data.total, 0);
    if (foodTotal > totalSpending * 0.3) {
      recommendations.push(`💰 You're spending ${(foodTotal / totalSpending * 100).toFixed(1)}% on food. Consider meal planning to save!`);
    }

    // Check for high shopping
    const shoppingTotal = byCategory['Shopping']?.total || 0;
    if (shoppingTotal > 150) {
      recommendations.push(`🛍️ Your shopping spending is high at $${shoppingTotal.toFixed(2)}. Try setting a monthly budget!`);
    }

    // Check for transportation
    const transportTotal = byCategory['Travel']?.total || 0;
    if (transportTotal > 100) {
      recommendations.push(`🚗 Transportation costs are ${(transportTotal / totalSpending * 100).toFixed(1)}% of spending. Consider carpooling!`);
    }

    // General recommendation if none triggered
    if (recommendations.length === 0) {
      recommendations.push('✅ Your spending looks balanced! Keep monitoring your budget.');
    }

    return recommendations;
  }

  /**
   * Get cached insights
   */
  static getCachedInsights(): SpendingInsights | null {
    try {
      const data = localStorage.getItem(this.INSIGHTS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Error getting cached insights:', error);
      return null;
    }
  }

  /**
   * Clear all Plaid data from localStorage
   */
  static clearAllData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.TRANSACTIONS_KEY);
      localStorage.removeItem(this.INSIGHTS_KEY);
      console.log('✅ All Plaid data cleared');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
    }
  }
}
