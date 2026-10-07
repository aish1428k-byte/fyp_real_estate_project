from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from django.db.models import Sum
from users.models import User
from common.permissions import IsFinanceManager


from property.models import Property
from django.db.models import Q

from .models import (
    BankAccount,
    Escrow,
    InstallmentPlan,
    PaymentTransaction,
    ReleaseRequest,
    PlatformWallet
)

from .serializers import (
    BankAccountSerializer,
    EscrowSerializer,
    InstallmentPlanSerializer,
    PaymentTransactionSerializer,
    ReleaseRequestSerializer,
    PlatformWalletSerializer
)



class CreateBankAccountView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        if BankAccount.objects.filter(user=request.user).exists():
            return Response(
                {"error": "Bank account already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = BankAccountSerializer(data=request.data)

        if serializer.is_valid():

            serializer.save(user=request.user)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class MyBankAccountView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        account = BankAccount.objects.filter(
            user=request.user
        ).first()

        if not account:
            return Response(
                {"error": "Bank account not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = BankAccountSerializer(account)

        return Response(serializer.data)
    


class CreateEscrowView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        property_id = request.data.get("property_id")
        buyer_id = request.data.get("buyer_id")

        try:

            buyer = User.objects.get(
                user_id=buyer_id
            )

        except User.DoesNotExist:

            return Response(
                {"error": "Buyer not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:

            property_obj = Property.objects.get(
                id=property_id
            )

        except Property.DoesNotExist:

            return Response(
                {"error": "Property not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if Escrow.objects.filter(
            property=property_obj
        ).exists():

            return Response(
                {"error": "Escrow already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )


        property_price = int(
            property_obj.price
        )

        commission_required = round(
            property_price * 0.03
        )

        total_payable = (
            property_price
            + commission_required
        )

        # ==========================================
        # CREATE ESCROW
        # ==========================================

        escrow = Escrow.objects.create(

            property=property_obj,

            buyer=buyer,

            seller=property_obj.owner,

            property_price=
            property_price,

            commission_required=
            commission_required,

            total_payable=
            total_payable
        )

        # ==========================================
        # PLATFORM WALLET
        # ==========================================

        PlatformWallet.objects.get_or_create(

            id=1,

            defaults={
                "total_commission": 0
            }
        )

        serializer = EscrowSerializer(
            escrow
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
    
class EscrowDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, escrow_id):

        try:
            escrow = Escrow.objects.get(
                id=escrow_id
            )
        except Escrow.DoesNotExist:
            return Response(
                {"error": "Escrow not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = EscrowSerializer(escrow)

        return Response(serializer.data)
    



class MyEscrowsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        escrows = Escrow.objects.filter(
            Q(buyer=request.user) |
            Q(seller=request.user)
        ).select_related(
            "property"
        )

        serializer = EscrowSerializer(
            escrows,
            many=True
        )

        return Response(serializer.data)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated


class CreateInstallmentPlanView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        escrow_id = request.data.get(
            "escrow_id"
        )

        total_installments = request.data.get(
            "total_installments"
        )

        try:

            escrow = Escrow.objects.get(
                id=escrow_id
            )

        except Escrow.DoesNotExist:

            return Response(
                {
                    "error":
                    "Escrow not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if InstallmentPlan.objects.filter(
            escrow=escrow
        ).exists():

            return Response(
                {
                    "error":
                    "Installment plan already exists"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            total_installments = int(
                total_installments
            )

        except:

            return Response(
                {
                    "error":
                    "Invalid installment count"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if total_installments <= 0:

            return Response(
                {
                    "error":
                    "Installments must be greater than zero"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # INTEGER SAFE INSTALLMENT
        # ==========================================

        installment_amount = (
            int(escrow.total_payable)
            //
            total_installments
        )

        # ==========================================
        # CREATE PLAN
        # ==========================================

        plan = InstallmentPlan.objects.create(

            escrow=escrow,

            total_amount=
            int(
                escrow.total_payable
            ),

            total_installments=
            total_installments,

            installment_amount=
            installment_amount
        )

        serializer = InstallmentPlanSerializer(
            plan
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
    


class InstallmentPlanDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, escrow_id):

        try:

            plan = InstallmentPlan.objects.get(
                escrow_id=escrow_id
            )

        except InstallmentPlan.DoesNotExist:

            return Response(
                {"error": "Plan not found"},
                status=404
            )

        serializer =InstallmentPlanSerializer(plan)

        return Response(
            serializer.data
        )    



from decimal import Decimal

    
class PayInstallmentView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        escrow_id = request.data.get(
            "escrow_id"
        )

        amount = request.data.get(
            "amount"
        )

        installment_no = request.data.get(
            "installment_no"
        )

        try:
            amount = Decimal(str(amount))
        except:
            return Response(
                {
                    "error":
                    "Invalid amount"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            installment_no = int(
                installment_no
            )
        except:
            return Response(
                {
                    "error":
                    "Invalid installment number"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            escrow = Escrow.objects.get(
                id=escrow_id
            )

        except Escrow.DoesNotExist:

            return Response(
                {
                    "error":
                    "Escrow not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )


        try:
            plan = InstallmentPlan.objects.get(
                escrow=escrow
            )

        except InstallmentPlan.DoesNotExist:

            return Response(
                {
                    "error":
                    "Installment plan not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )


        account_number = request.data.get(
            "account_number"
        )

        buyer_account = (
            BankAccount.objects.filter(
                user=request.user,
                account_number=account_number
            ).first()
        )

        if not buyer_account:

            return Response(
                {
                    "error":
                    "Invalid bank account"
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        remaining_payable = (
            escrow.total_payable
            - escrow.total_received
        )

        if remaining_payable <= 0:

            return Response(
                {
                    "error":
                    "Property payment already completed"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if amount > remaining_payable:

            return Response(
                {
                    "error":
                    f"Only {remaining_payable} remaining to be paid"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # INSTALLMENT ALREADY PAID
        # ==========================================

        if PaymentTransaction.objects.filter(
            escrow=escrow,
            installment_no=installment_no,
            transaction_type="installment"
        ).exists():

            return Response(
                {
                    "error":
                    f"Installment #{installment_no} already paid."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # FORCE SEQUENTIAL PAYMENT
        # ==========================================

        expected_installment = (
            PaymentTransaction.objects.filter(
                escrow=escrow,
                transaction_type="installment"
            ).count()
            + 1
        )

        if (
            installment_no !=
            expected_installment
        ):

            return Response(
                {
                    "error":
                    f"Please pay Installment #{expected_installment} first."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        if (
            installment_no ==
            plan.total_installments
        ):

            if amount != remaining_payable:

                return Response(
                    {
                        "error":
                        f"This is the last installment. Remaining amount is {remaining_payable}. Please pay the exact remaining amount."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


        if buyer_account.balance < amount:

            return Response(
                {
                    "error":
                    "Insufficient balance"
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        buyer_account.balance -= amount
        buyer_account.save()


        escrow.total_received += amount
        escrow.save()


        transaction = (
            PaymentTransaction.objects.create(

                escrow=escrow,

                buyer=request.user,

                buyer_account=buyer_account,

                amount=amount,

                installment_no=installment_no,

                transaction_type="installment",

                status="completed"
            )
        )

        serializer = (
            PaymentTransactionSerializer(
                transaction
            )
        )

        return Response(
            {
                "message":
                "Installment paid successfully",

                "transaction":
                serializer.data,

                "escrow_total_received":
                escrow.total_received,

                "remaining_property_payment":
                (
                    escrow.total_payable
                    - escrow.total_received
                ),

                "buyer_balance":
                buyer_account.balance
            },
            status=status.HTTP_200_OK
        )
class MyTransactionsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        transactions = PaymentTransaction.objects.filter(
            buyer=request.user
        ).order_by("-created_at")

        serializer = PaymentTransactionSerializer(
            transactions,
            many=True
        )

        return Response(serializer.data)
    


class CreateReleaseRequestView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        escrow_id = request.data.get("escrow_id")
        amount = request.data.get("amount")
        account_number = request.data.get("account_number")

        try:
            amount = Decimal(str(amount))

        except:
            return Response(
                {"error": "Invalid amount"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if amount <= 0:

            return Response(
                {"error": "Amount must be greater than zero"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            escrow = Escrow.objects.get(
                id=escrow_id
            )

        except Escrow.DoesNotExist:

            return Response(
                {"error": "Escrow not found"},
                status=status.HTTP_404_NOT_FOUND
            )

   
        if escrow.total_released >= escrow.total_payable:

            return Response(
                {
                    "error":
                    "Property payment already fully released"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

  
        bank_account = BankAccount.objects.filter(
            user=request.user,
            account_number=account_number
        ).first()

        if not bank_account:

            return Response(
                {
                    "error":
                    "Invalid bank account"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

  
        available_for_release = (
            escrow.total_received
            - escrow.total_released
        )

        if available_for_release <= 0:

            return Response(
                {
                    "error":
                    "No funds available for release"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if amount > available_for_release:

            return Response(
                {
                    "error":
                    f"Only {available_for_release} available for release"
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        release_request = ReleaseRequest.objects.create(

            escrow=escrow,

            seller=request.user,

            bank_account=bank_account,

            requested_amount=amount
        )

        serializer = ReleaseRequestSerializer(
            release_request
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
    

class PendingReleaseRequestsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        requests = ReleaseRequest.objects.filter(
            status="pending"
        )

        serializer = ReleaseRequestSerializer(
            requests,
            many=True
        )

        return Response(serializer.data)
    
class RejectReleaseRequestView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):

        try:

            release_request = ReleaseRequest.objects.get(
                id=request_id
            )
            
        

        except ReleaseRequest.DoesNotExist:

            return Response(
                {"error": "Request not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        
        release_request.status = "rejected"

        release_request.approved_by = request.user

        release_request.save()

        return Response(
            {"message": "Request rejected"}
        )
    
    
from decimal import Decimal
from common.ownership_transfer import (
    transfer_property_ownership
)


from ownership.serializers import (
    OwnershipTransferSerializer
)

class ApproveReleaseRequestView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):

        try:
            release_request = ReleaseRequest.objects.get(
                id=request_id
            )

        except ReleaseRequest.DoesNotExist:

            return Response(
                {"error": "Request not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if release_request.status == "approved":

            return Response(
                {"error": "Request already approved"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if release_request.status == "rejected":

            return Response(
                {"error": "Request already rejected"},
                status=status.HTTP_400_BAD_REQUEST
            )

        escrow = release_request.escrow

        seller_account = release_request.bank_account

        wallet, created = PlatformWallet.objects.get_or_create(
            id=1,
            defaults={
                "total_commission": 0
            }
        )

        property_price = escrow.property_price

        total_commission_required = (
        escrow.commission_required
        )

        requested_amount = release_request.requested_amount

  
        available_funds = (
            escrow.total_received
            - escrow.total_released
            - escrow.commission_amount
        )

        if not escrow.commission_completed:

            # No new money available
            if available_funds <= 0:

                return Response(
                    {
                        "message":
                        "Waiting for next installment. No new funds available in escrow."
                    },
                    status=status.HTTP_200_OK
                )

            remaining_commission = (
                total_commission_required
                - escrow.commission_amount
            )

            # Still not enough money to complete commission
            if available_funds < remaining_commission:

                wallet.total_commission += available_funds

                escrow.commission_amount += available_funds

                wallet.save()
                escrow.save()

                return Response(
                    {
                        "message":
                        "Waiting for next installment. Commission not completed yet.",

                        "commission_collected":
                        str(escrow.commission_amount),

                        "commission_remaining":
                        str(
                            total_commission_required
                            - escrow.commission_amount
                        )
                    },
                    status=status.HTTP_200_OK
                )

            # Complete remaining commission
            wallet.total_commission += remaining_commission

            escrow.commission_amount += remaining_commission

            escrow.commission_completed = True

            wallet.save()
            escrow.save()

            available_funds -= remaining_commission


        if requested_amount > available_funds:

            return Response(
                {
                    "message":
                    "Waiting for next installment. Requested amount exceeds currently available funds.",

                    "available_funds":
                    str(available_funds),

                    "requested_amount":
                    str(requested_amount)
                },
                status=status.HTTP_200_OK
            )

      
        seller_release_amount = requested_amount

        seller_account.balance += seller_release_amount

        escrow.total_released += seller_release_amount

        seller_account.save()
        escrow.save()

        release_request.status = "approved"
        release_request.approved_by = request.user
        release_request.save()


      
        ownership_data = None

        if (
            escrow.total_released >=
            escrow.property_price
            and
            escrow.commission_completed
        ):

            transfer = (
                transfer_property_ownership(
                    escrow
                )
            )

            if transfer:
                ownership_data = (
                    OwnershipTransferSerializer(
                        transfer
                    ).data
                )


        return Response(
            {
                "message": "Release approved",

                "seller_received":
                str(seller_release_amount),

                "commission_collected":
                str(escrow.commission_amount),

                "commission_completed":
                escrow.commission_completed,

                "total_released":
                str(escrow.total_released),

                "ownership_transferred":
                ownership_data is not None,

                "ownership_details":
                ownership_data
            },
            status=status.HTTP_200_OK
        )

      


class MyReleaseRequestsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        escrow_id = request.GET.get(
            "escrow_id"
        )

        requests = ReleaseRequest.objects.filter(
            seller=request.user
        )

        if escrow_id:
            requests = requests.filter(
                escrow_id=escrow_id
            )

        serializer = ReleaseRequestSerializer(
            requests.order_by("-id"),
            many=True
        )

        return Response(serializer.data)
    
class EscrowListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        escrows = Escrow.objects.select_related(
            "property",
            "buyer",
            "seller"
        )

        serializer = EscrowSerializer(
            escrows,
            many=True
        )

        return Response(serializer.data)
    


class EscrowSummaryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, escrow_id):

        try:

            escrow = Escrow.objects.get(
                id=escrow_id
            )

        except Escrow.DoesNotExist:

            return Response(
                {
                    "error":
                    "Escrow not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        
        available_balance = (
            escrow.total_received
            - escrow.total_released
            - escrow.commission_amount
        )

        remaining_payment = (
            escrow.total_payable
            - escrow.total_received
        )

       
        seller_total_amount = (
            escrow.total_payable
            - escrow.commission_required
        )

        seller_remaining_amount = (
            seller_total_amount
            - escrow.total_released
        )

        if seller_remaining_amount < 0:
            seller_remaining_amount = Decimal("0")

        

        return Response({

            "property_price":
            int(round(float(escrow.property_price))),

            "commission_required":
            int(round(float(escrow.commission_required))),

            "commission_collected":
            int(round(float(escrow.commission_amount))),

            "commission_completed":
            escrow.commission_completed,

            "total_payable":
            int(round(float(escrow.total_payable))),

            "total_received":
            int(round(float(escrow.total_received))),

            "remaining_payment":
            int(round(float(remaining_payment))),

            "total_released":
            int(round(float(escrow.total_released))),

            "available_balance":
            int(round(float(available_balance))),

            # seller specific
            "seller_total_amount":
            int(round(float(seller_total_amount))),

            "seller_remaining_amount":
            int(round(float(seller_remaining_amount)))

        })
    


class EscrowTransactionsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, escrow_id):

        transactions = PaymentTransaction.objects.filter(
            escrow_id=escrow_id
        ).order_by("installment_no")

        serializer = PaymentTransactionSerializer(
            transactions,
            many=True
        )

        return Response(serializer.data)
    
class FinanceDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        total_transactions = (
            PaymentTransaction.objects.count()
        )

        total_received = (
            Escrow.objects.aggregate(
                total=Sum("total_received")
            )["total"]
            or 0
        )

        total_released = (
            Escrow.objects.aggregate(
                total=Sum("total_released")
            )["total"]
            or 0
        )

        commission_earned = (
            PlatformWallet.objects.aggregate(
                total=Sum("total_commission")
            )["total"]
            or 0
        )

        pending_requests = (
            ReleaseRequest.objects.filter(
                status="pending"
            ).count()
        )

        total_property_value = (
            Escrow.objects.aggregate(
                total=Sum("property_price")
            )["total"]
            or 0
        )

        total_payable_amount = (
            Escrow.objects.aggregate(
                total=Sum("total_payable")
            )["total"]
            or 0
        )
        failed_transactions = (
        PaymentTransaction.objects.filter(
            status="failed"
        ).count()
         )
        recent_transactions = []
        

        transactions = (
            PaymentTransaction.objects
            .order_by("-id")[:5]
        )

        for tx in transactions:
            recent_transactions.append({
                "id": tx.id,
                "type": tx.transaction_type,
                "amount": str(tx.amount),
                "date": tx.created_at.strftime(
                    "%d-%m-%Y"
                ),
                "status": tx.status
            })

            property_summary = []

            escrows = Escrow.objects.select_related(
                "property",
                "buyer",
                "seller"
            )

            for escrow in escrows:

                property_summary.append({

                    "property_title":
                    escrow.property.title,

                    "total_price":
                    float(escrow.property_price),

                    "total_payable":
                    float(escrow.total_payable),

                    "received":
                    float(escrow.total_received),

                    "remaining":
                    float(
                        escrow.total_payable
                        -
                        escrow.total_received
                    ),

                    "released":
                    float(
                        escrow.total_released
                    ),

                    "status":
                    (
                        "Completed"
                        if escrow.total_received
                        >= escrow.total_payable
                        else "In Progress"
                    )
                })

        return Response({

        "total_transactions":
        total_transactions,

        "total_property_value":
        total_property_value,

        "total_payable_amount":
        total_payable_amount,

        "total_received":
        total_received,

        "total_released":
        total_released,

        "commission_earned":
        commission_earned,

        "pending_requests":
        pending_requests,

        "failed_transactions":
        failed_transactions,

        "recent_transactions":
        recent_transactions,

        "property_summary":
         property_summary
    })