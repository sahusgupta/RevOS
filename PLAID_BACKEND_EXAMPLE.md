# Plaid Backend Implementation Guide

This guide shows you how to implement the Plaid backend endpoints that the frontend expects.

## Required Dependencies

```bash
pip install plaid-python python-dotenv flask-cors
```

## Environment Variables

Add these to your `.env` file:

```env
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret_key
PLAID_ENV=sandbox  # or development/production
PLAID_PRODUCTS=transactions,auth,identity
PLAID_COUNTRY_CODES=US
```

## Backend Implementation Example

```python
# app/plaid_service.py
import os
from plaid.api import plaid_api
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from plaid.configuration import Configuration
from plaid.api_client import ApiClient
from datetime import datetime, timedelta

class PlaidService:
    def __init__(self):
        configuration = Configuration(
            host=getattr(plaid.Environment, os.getenv('PLAID_ENV', 'sandbox')),
            api_key={
                'clientId': os.getenv('PLAID_CLIENT_ID'),
                'secret': os.getenv('PLAID_SECRET')
            }
        )
        api_client = ApiClient(configuration)
        self.client = plaid_api.PlaidApi(api_client)
    
    def create_link_token(self, user_id: str):
        """Create a link token for Plaid Link initialization"""
        request = LinkTokenCreateRequest(
            products=[Products('transactions'), Products('auth')],
            client_name="RevOS",
            country_codes=[CountryCode('US')],
            language='en',
            user=LinkTokenCreateRequestUser(client_user_id=user_id)
        )
        response = self.client.link_token_create(request)
        return response['link_token']
    
    def exchange_public_token(self, public_token: str):
        """Exchange public token for access token"""
        request = ItemPublicTokenExchangeRequest(public_token=public_token)
        response = self.client.item_public_token_exchange(request)
        return {
            'access_token': response['access_token'],
            'item_id': response['item_id']
        }
    
    def get_accounts(self, access_token: str):
        """Get account information"""
        request = AccountsGetRequest(access_token=access_token)
        response = self.client.accounts_get(request)
        return response['accounts']
    
    def get_transactions(self, access_token: str, start_date=None, end_date=None):
        """Get transactions for the past 30 days"""
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()
            
        request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date.date(),
            end_date=end_date.date()
        )
        response = self.client.transactions_get(request)
        return response['transactions']

# app/routes/plaid.py
from flask import Blueprint, request, jsonify
from app.plaid_service import PlaidService
from app.models import User, PlaidItem  # Your user models

plaid_bp = Blueprint('plaid', __name__)
plaid_service = PlaidService()

@plaid_bp.route('/create-link-token', methods=['POST'])
def create_link_token():
    """Create link token for Plaid Link"""
    try:
        # Get user from session/auth
        user_id = request.json.get('user_id')  # Implement your auth logic
        
        link_token = plaid_service.create_link_token(user_id)
        
        return jsonify({
            'link_token': link_token,
            'expiration': '2024-01-01T00:00:00Z'  # Set appropriate expiration
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@plaid_bp.route('/exchange-public-token', methods=['POST'])
def exchange_public_token():
    """Exchange public token for access token"""
    try:
        public_token = request.json.get('public_token')
        institution_id = request.json.get('institution_id')
        accounts = request.json.get('accounts', [])
        
        # Exchange token
        result = plaid_service.exchange_public_token(public_token)
        access_token = result['access_token']
        item_id = result['item_id']
        
        # Store in your database
        # plaid_item = PlaidItem(
        #     user_id=current_user.id,
        #     access_token=access_token,
        #     item_id=item_id,
        #     institution_id=institution_id
        # )
        # db.session.add(plaid_item)
        # db.session.commit()
        
        # Get account details
        accounts_data = plaid_service.get_accounts(access_token)
        
        return jsonify({
            'success': True,
            'accounts': accounts_data,
            'item_id': item_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@plaid_bp.route('/accounts', methods=['GET'])
def get_accounts():
    """Get user's connected accounts"""
    try:
        # Get user's plaid items from database
        # plaid_items = PlaidItem.query.filter_by(user_id=current_user.id).all()
        
        all_accounts = []
        # for item in plaid_items:
        #     accounts = plaid_service.get_accounts(item.access_token)
        #     all_accounts.extend(accounts)
        
        return jsonify({'accounts': all_accounts})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@plaid_bp.route('/transactions', methods=['GET'])
def get_transactions():
    """Get user's transactions"""
    try:
        # Get user's plaid items from database
        # plaid_items = PlaidItem.query.filter_by(user_id=current_user.id).all()
        
        all_transactions = []
        # for item in plaid_items:
        #     transactions = plaid_service.get_transactions(item.access_token)
        #     all_transactions.extend(transactions)
        
        return jsonify({'transactions': all_transactions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@plaid_bp.route('/webhook', methods=['POST'])
def plaid_webhook():
    """Handle Plaid webhooks"""
    try:
        webhook_data = request.json
        webhook_type = webhook_data.get('webhook_type')
        webhook_code = webhook_data.get('webhook_code')
        item_id = webhook_data.get('item_id')
        
        # Handle different webhook types
        if webhook_type == 'TRANSACTIONS':
            if webhook_code == 'INITIAL_UPDATE':
                # Initial transaction data available
                pass
            elif webhook_code == 'HISTORICAL_UPDATE':
                # Historical transaction data available
                pass
            elif webhook_code == 'DEFAULT_UPDATE':
                # New transaction data available
                pass
        
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@plaid_bp.route('/delete-item', methods=['DELETE'])
def delete_item():
    """Remove a connected account"""
    try:
        item_id = request.json.get('item_id')
        
        # Remove from database
        # plaid_item = PlaidItem.query.filter_by(item_id=item_id).first()
        # if plaid_item:
        #     db.session.delete(plaid_item)
        #     db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## Database Models Example

```python
# app/models.py
from app import db
from datetime import datetime

class PlaidItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    access_token = db.Column(db.String(255), nullable=False)
    item_id = db.Column(db.String(255), nullable=False, unique=True)
    institution_id = db.Column(db.String(255))
    institution_name = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PlaidAccount(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    plaid_item_id = db.Column(db.Integer, db.ForeignKey('plaid_item.id'), nullable=False)
    account_id = db.Column(db.String(255), nullable=False, unique=True)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    subtype = db.Column(db.String(50))
    mask = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PlaidTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.String(255), db.ForeignKey('plaid_account.account_id'), nullable=False)
    transaction_id = db.Column(db.String(255), nullable=False, unique=True)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    category = db.Column(db.JSON)
    merchant_name = db.Column(db.String(255))
    pending = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

## Frontend Integration

The frontend PlaidLink component is already set up to call these endpoints. You just need to:

1. Implement the backend endpoints above
2. Update the `createLinkToken` function in `PlaidLink.tsx` to call your actual API
3. Handle the success/error callbacks appropriately
4. Store user authentication state to associate accounts with users

## Security Notes

- Never expose your Plaid secret key in the frontend
- Always validate user authentication before processing Plaid requests
- Use HTTPS in production
- Implement proper error handling and logging
- Consider rate limiting for API endpoints
- Store access tokens securely (encrypted in database)

## Testing

Use Plaid's sandbox environment for testing with these test credentials:
- Username: `user_good`
- Password: `pass_good`
- PIN: `1234`

The frontend component includes mock data for demonstration purposes until you implement the backend.
