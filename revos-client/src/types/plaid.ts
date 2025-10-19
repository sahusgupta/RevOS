// Plaid-related TypeScript types for frontend use

export interface PlaidAccount {
  id: string;
  name: string;
  type: 'depository' | 'credit' | 'loan' | 'investment';
  subtype: string;
  mask: string;
  balance?: number;
  status: 'connected' | 'error' | 'updating';
  institutionId?: string;
  institutionName?: string;
}

export interface PlaidTransaction {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  name: string;
  category: string[];
  merchantName?: string;
  pending: boolean;
}

export interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
}

export interface PlaidExchangeTokenRequest {
  public_token: string;
  institution_id?: string;
  accounts?: Array<{
    id: string;
    name: string;
    type: string;
    subtype: string;
  }>;
}

export interface PlaidExchangeTokenResponse {
  access_token: string;
  item_id: string;
  request_id: string;
}

export interface PlaidWebhookData {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  error?: any;
}

// API endpoints you'll need to implement in your backend:
export const PLAID_API_ENDPOINTS = {
  CREATE_LINK_TOKEN: '/api/plaid/create-link-token',
  EXCHANGE_PUBLIC_TOKEN: '/api/plaid/exchange-public-token', 
  GET_ACCOUNTS: '/api/plaid/accounts',
  GET_TRANSACTIONS: '/api/plaid/transactions',
  DELETE_ITEM: '/api/plaid/delete-item',
  WEBHOOK: '/api/plaid/webhook'
} as const;
