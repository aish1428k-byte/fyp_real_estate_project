from django.urls import path
from .views import (
    AllBlockchainTransactionsView,
    PropertyBlockchainTransactionView,
    StorePropertyTransactionView,
    TransferOwnershipView,
    OwnershipHistoryView,
    PropertyOwnershipHistoryView,
    BlockchainTransactionsView,
    PropertyReceiptView,



)

urlpatterns = [

    path(
        "blockchain/transactions/",
        AllBlockchainTransactionsView.as_view(),
        name="all-blockchain-transactions"
    ),

    path(
        "blockchain/transactions/<int:property_id>/",
        PropertyBlockchainTransactionView.as_view(),
        name="property-blockchain-transaction"
    ),
    path(
        "blockchain/store/",
        StorePropertyTransactionView.as_view(),
        name="store-property-transaction"
    ),

    path(
        "transfer/",
        TransferOwnershipView.as_view()
    ),

    path(
        "history/",
        OwnershipHistoryView.as_view()
    ),

    path(
        "history/<int:property_id>/",
        PropertyOwnershipHistoryView.as_view()
    ),

    path(
        "blockchain-db/",
        BlockchainTransactionsView.as_view()
    ),
    path(
    "receipt/<int:property_id>/",
    PropertyReceiptView.as_view(),
    name="property-receipt"
    ),
]
