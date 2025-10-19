"""
Plaid Integration Service
Handles bank account linking, transaction retrieval, and spending analytics
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import plaid
from plaid.api import plaid_api
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.transactions_recurring_get_request import TransactionsRecurringGetRequest

logger = logging.getLogger(__name__)

# Initialize Plaid client with explicit credentials from environment
# The SDK needs these passed explicitly, not auto-loaded
client_id = os.getenv('PLAID_CLIENT_ID')
secret = os.getenv('PLAID_SECRET')
api_key = os.getenv('PLAID_API_KEY')

if not client_id or not secret:
    logger.warning("⚠️  Plaid credentials not found in environment variables!")
    logger.warning("   Make sure PLAID_CLIENT_ID and PLAID_SECRET are set in .env")

configuration = plaid.Configuration(
    host=plaid.Environment.Sandbox,  # Use Production for live
)

# Manually set credentials on the configuration
configuration.api_key['clientId'] = client_id
configuration.api_key['secret'] = secret
configuration.api_key['plaidVersion'] = '2020-09-14'

api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)


class PlaidManager:
    """Manages Plaid API interactions for bank account integration"""

    @staticmethod
    def create_link_token(user_id: str, client_name: str = "RevOS") -> Dict[str, Any]:
        """
        Create a Plaid Link token for initiating account connection
        
        Args:
            user_id: User identifier for session management
            client_name: Name of the client (for Plaid Link)
            
        Returns:
            Dictionary containing link_token and expiration
        """
        try:
            from plaid.model.link_token_create_request import LinkTokenCreateRequest
            from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
            from plaid.model.country_code import CountryCode
            from plaid.model.products import Products

            request = LinkTokenCreateRequest(
                products=[Products("auth"), Products("transactions")],
                client_name=client_name,
                country_codes=[CountryCode("US")],
                language="en",
                user=LinkTokenCreateRequestUser(
                    client_user_id=str(user_id),
                ),
            )

            response = client.link_token_create(request)
            logger.info(f"✅ Created Plaid Link token for user {user_id}")
            
            return {
                "link_token": response.link_token,
                "expiration": response.expiration.isoformat() if response.expiration else None,
            }
        except Exception as e:
            logger.error(f"❌ Error creating Plaid Link token: {e}")
            raise

    @staticmethod
    def exchange_public_token(public_token: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Exchange Plaid public token for access token
        
        Args:
            public_token: Public token from Plaid Link
            metadata: Metadata about connected institution and accounts
            
        Returns:
            Dictionary containing access_token and item_id
        """
        try:
            request = ItemPublicTokenExchangeRequest(public_token=public_token)
            response = client.item_public_token_exchange(request)

            logger.info(f"✅ Exchanged public token for item {response.item_id}")
            
            return {
                "access_token": response.access_token,
                "item_id": response.item_id,
                "institution": metadata.get("institution", {}),
                "accounts": metadata.get("accounts", []),
            }
        except Exception as e:
            logger.error(f"❌ Error exchanging public token: {e}")
            raise

    @staticmethod
    def get_accounts(access_token: str) -> List[Dict[str, Any]]:
        """
        Get list of accounts for an access token
        
        Args:
            access_token: Plaid access token
            
        Returns:
            List of account information
        """
        try:
            request = AccountsGetRequest(access_token=access_token)
            response = client.accounts_get(request)

            accounts = []
            for account in response.accounts:
                accounts.append({
                    "account_id": account.account_id,
                    "name": account.name,
                    "type": account.type,
                    "subtype": account.subtype,
                    "mask": account.mask,
                    "balance": {
                        "available": account.balances.available,
                        "current": account.balances.current,
                        "limit": account.balances.limit,
                    }
                })

            logger.info(f"✅ Retrieved {len(accounts)} accounts")
            return accounts
        except Exception as e:
            logger.error(f"❌ Error getting accounts: {e}")
            raise

    @staticmethod
    def get_transactions(
        access_token: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get transactions for an access token
        
        Args:
            access_token: Plaid access token
            start_date: Start date (YYYY-MM-DD), defaults to 30 days ago
            end_date: End date (YYYY-MM-DD), defaults to today
            limit: Maximum number of transactions to retrieve
            
        Returns:
            List of transactions
        """
        try:
            # Default to last 30 days
            if not end_date:
                end_date = datetime.now().strftime("%Y-%m-%d")
            if not start_date:
                start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

            request = TransactionsGetRequest(
                access_token=access_token,
                start_date=start_date,
                end_date=end_date,
                options={"count": limit, "offset": 0},
            )

            response = client.transactions_get(request)

            transactions = []
            for transaction in response.transactions:
                transactions.append({
                    "transaction_id": transaction.transaction_id,
                    "name": transaction.name,
                    "amount": transaction.amount,
                    "date": transaction.date.isoformat(),
                    "category": transaction.category,
                    "merchant_name": transaction.merchant_name,
                    "account_id": transaction.account_id,
                    "pending": transaction.pending,
                })

            logger.info(f"✅ Retrieved {len(transactions)} transactions from {start_date} to {end_date}")
            return transactions
        except Exception as e:
            logger.error(f"❌ Error getting transactions: {e}")
            raise

    @staticmethod
    def get_spending_by_category(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze spending by category
        
        Args:
            transactions: List of transactions
            
        Returns:
            Dictionary with spending analysis by category
        """
        try:
            spending_by_category = {}
            
            for transaction in transactions:
                category = transaction.get("category", ["Other"])[0] if transaction.get("category") else "Other"
                amount = transaction.get("amount", 0)
                
                if category not in spending_by_category:
                    spending_by_category[category] = {
                        "total": 0,
                        "count": 0,
                        "transactions": []
                    }
                
                spending_by_category[category]["total"] += amount
                spending_by_category[category]["count"] += 1
                spending_by_category[category]["transactions"].append({
                    "name": transaction.get("name"),
                    "amount": amount,
                    "date": transaction.get("date"),
                })

            # Sort by total spending
            sorted_categories = sorted(
                spending_by_category.items(),
                key=lambda x: x[1]["total"],
                reverse=True
            )

            logger.info(f"✅ Analyzed spending across {len(sorted_categories)} categories")
            
            return {
                "by_category": dict(sorted_categories),
                "total_spending": sum(cat["total"] for cat in spending_by_category.values()),
                "average_transaction": sum(cat["total"] for cat in spending_by_category.values()) / sum(cat["count"] for cat in spending_by_category.values()) if spending_by_category else 0,
            }
        except Exception as e:
            logger.error(f"❌ Error analyzing spending: {e}")
            raise

    @staticmethod
    def get_recurring_transactions(access_token: str) -> List[Dict[str, Any]]:
        """
        Get recurring transactions
        
        Args:
            access_token: Plaid access token
            
        Returns:
            List of recurring transactions
        """
        try:
            request = TransactionsRecurringGetRequest(access_token=access_token)
            response = client.transactions_recurring_get(request)

            recurring = []
            for transaction in response.recurring_transactions:
                recurring.append({
                    "name": transaction.merchant_name or transaction.description,
                    "amount": transaction.amounts[0]["amount"] if transaction.amounts else 0,
                    "frequency": transaction.frequency,
                    "last_date": transaction.last_amount_at.isoformat() if transaction.last_amount_at else None,
                    "next_expected_date": transaction.next_scheduled_transaction_date.isoformat() if transaction.next_scheduled_transaction_date else None,
                })

            logger.info(f"✅ Retrieved {len(recurring)} recurring transactions")
            return recurring
        except Exception as e:
            logger.error(f"❌ Error getting recurring transactions: {e}")
            # Recurring transactions may not be available in all environments
            logger.warning("Recurring transactions not available in this environment")
            return []

    @staticmethod
    def get_insights(access_token: str) -> Dict[str, Any]:
        """
        Generate spending insights and recommendations
        
        Args:
            access_token: Plaid access token
            
        Returns:
            Dictionary with spending insights
        """
        try:
            # Get transactions from last 90 days
            end_date = datetime.now().strftime("%Y-%m-%d")
            start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")

            transactions = PlaidManager.get_transactions(access_token, start_date, end_date, 500)
            spending_analysis = PlaidManager.get_spending_by_category(transactions)

            # Calculate insights
            total_spending = spending_analysis["total_spending"]
            daily_average = total_spending / 90
            
            # Get top spending categories
            top_categories = sorted(
                spending_analysis["by_category"].items(),
                key=lambda x: x[1]["total"],
                reverse=True
            )[:5]

            insights = {
                "period": {
                    "start_date": start_date,
                    "end_date": end_date,
                    "days": 90,
                },
                "summary": {
                    "total_spending": total_spending,
                    "daily_average": daily_average,
                    "monthly_average": total_spending / 3,  # Approximate monthly
                    "transaction_count": sum(cat["count"] for cat in spending_analysis["by_category"].values()),
                },
                "top_categories": [
                    {
                        "category": cat[0],
                        "amount": cat[1]["total"],
                        "percentage": (cat[1]["total"] / total_spending * 100) if total_spending > 0 else 0,
                        "transaction_count": cat[1]["count"],
                    }
                    for cat in top_categories
                ],
                "recommendations": PlaidManager._generate_recommendations(spending_analysis),
            }

            logger.info(f"✅ Generated spending insights")
            return insights
        except Exception as e:
            logger.error(f"❌ Error generating insights: {e}")
            raise

    @staticmethod
    def _generate_recommendations(spending_analysis: Dict[str, Any]) -> List[str]:
        """
        Generate personalized spending recommendations
        
        Args:
            spending_analysis: Spending analysis data
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        try:
            categories = spending_analysis.get("by_category", {})
            
            # Check for high dining spending
            if "FOOD_AND_DRINK" in categories:
                amount = categories["FOOD_AND_DRINK"]["total"]
                if amount > 200:
                    recommendations.append("💰 Consider reducing dining out expenses - you're spending over $200/month here!")

            # Check for high shopping
            if "SHOPPING" in categories:
                amount = categories["SHOPPING"]["total"]
                if amount > 150:
                    recommendations.append("🛍️ Your shopping spending is high. Try setting a monthly budget!")

            # Check for subscriptions
            subscription_keywords = ["subscription", "spotify", "netflix", "hulu", "gym", "membership"]
            monthly_subscriptions = sum(
                cat["total"] for cat_name, cat in categories.items()
                if any(keyword in cat_name.lower() for keyword in subscription_keywords)
            )
            if monthly_subscriptions > 50:
                recommendations.append(f"📺 You're spending ${monthly_subscriptions:.2f}/month on subscriptions. Audit which ones you actually use!")

            # General recommendation if none triggered
            if not recommendations:
                recommendations.append("✅ Your spending looks balanced! Keep monitoring your budget.")

        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")

        return recommendations
