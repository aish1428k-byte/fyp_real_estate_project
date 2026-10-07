from django.urls import path

from .views import (
    CreateBankAccountView,
    MyBankAccountView,
    CreateEscrowView,
    EscrowDetailView,
    CreateInstallmentPlanView,
    InstallmentPlanDetailView,
    PayInstallmentView,
    MyTransactionsView,
    CreateReleaseRequestView,
    PendingReleaseRequestsView,
    ApproveReleaseRequestView,
    RejectReleaseRequestView,
    EscrowSummaryView,
    FinanceDashboardView,EscrowListView,
    EscrowTransactionsView,
    MyReleaseRequestsView,
    MyEscrowsView

)

urlpatterns = [

    # Bank Account
    path(
        "accounts/create/",
        CreateBankAccountView.as_view()
    ),

    path(
        "accounts/me/",
        MyBankAccountView.as_view()
    ),

    # Escrow
    path(
        "escrow/create/",
        CreateEscrowView.as_view()
    ),

    path(
        "escrow/<int:escrow_id>/",
        EscrowDetailView.as_view()
    ),
    path(
    "escrows/",
    EscrowListView.as_view()),

    path(
    "escrow/<int:escrow_id>/transactions/",
    EscrowTransactionsView.as_view()),

    path(
    "my-escrows/",
    MyEscrowsView.as_view()
    ),


    # Installments

    path(
        "installments/create/",
        CreateInstallmentPlanView.as_view()
    ),

    path(
    "installments/<int:escrow_id>/",
    InstallmentPlanDetailView.as_view()
    ),

    # Payments

    path(
        "pay/",
        PayInstallmentView.as_view()
    ),

    path(
        "transactions/",
        MyTransactionsView.as_view()
    ),

    # Release Requests

    path(
        "release/request/",
        CreateReleaseRequestView.as_view()
    ),

    path(
        "release/pending/",
        PendingReleaseRequestsView.as_view()
    ),

    path(
        "release/approve/<int:request_id>/",
        ApproveReleaseRequestView.as_view()
    ),

    path(
        "release/reject/<int:request_id>/",
        RejectReleaseRequestView.as_view()
    ),
    path(
    "escrow/<int:escrow_id>/summary/",
    EscrowSummaryView.as_view()
    ),

    path(
        "dashboard/",
        FinanceDashboardView.as_view()
    ),

    path(
    "release/my/",
    MyReleaseRequestsView.as_view()
    ),
]
