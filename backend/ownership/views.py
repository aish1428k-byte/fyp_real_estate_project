from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from common.blockchain_utils import BlockchainService

blockchain = BlockchainService()


class AllBlockchainTransactionsView(APIView):

    def get(self, request):
        try:
            data = blockchain.get_all_property_transactions()

            return Response(
                data,
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class PropertyBlockchainTransactionView(APIView):

    def get(self, request, property_id):
        try:
            data = blockchain.get_property_transaction(
                property_id
            )

            return Response(
                data,
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class StorePropertyTransactionView(APIView):

    def post(self, request):
        try:
            tx_hash = blockchain.store_property_transaction(
                request.data["property_id"],
                request.data["previous_owner_id"],
                request.data["new_owner_id"],
                request.data["total_paid"],
                request.data["commission"],
            )

            return Response(
                {
                    "message": "Stored successfully",
                    "tx_hash": tx_hash
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        


# ---------------

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from common.permissions import IsFinanceManager

from property.models import Property
from finance.models import Escrow

from .models import (
    OwnershipTransfer,
    BlockchainPropertyTransaction
)

from .serializers import (
    OwnershipTransferSerializer,
    BlockchainPropertyTransactionSerializer
)
from common.ownership_transfer import (
    transfer_property_ownership
)

from common.blockchain_utils import BlockchainService

blockchain = BlockchainService()


class TransferOwnershipView(APIView):

    permission_classes = [IsAuthenticated ,IsFinanceManager]
 

    def post(self, request):

        property_id = request.data.get(
            "property_id"
        )

        try:
            escrow = Escrow.objects.get(
                property_id=property_id
            )

            property_obj = Property.objects.get(
                id=property_id
            )

        except (
            Escrow.DoesNotExist,
            Property.DoesNotExist
        ):
            return Response(
                {
                    "error":
                    "Property or Escrow not found"
                },
                status=404
            )

        if (
            escrow.total_released <
            escrow.total_payable
        ):
            return Response(
                {
                    "error":
                    "Property payment not completed."
                },
                status=400
            )

        if escrow.buyer is None:
            return Response(
                {
                    "error":
                    "Buyer not found."
                },
                status=400
            )

        if OwnershipTransfer.objects.filter(
            property=property_obj
        ).exists():

            return Response(
                {
                    "error":
                    "Ownership already transferred."
                },
                status=400
            )

        transfer = transfer_property_ownership(escrow)

        if transfer is None:
            return Response(
                {
                    "error":
                    "Ownership already transferred."
                },
                status=400
            )

        serializer = OwnershipTransferSerializer(
            transfer
        )

        return Response(
            serializer.data,
            status=201
        )        
        

class OwnershipHistoryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        transfers = (
            OwnershipTransfer.objects.all()
            .order_by("-id")
        )

        serializer = (
            OwnershipTransferSerializer(
                transfers,
                many=True
            )
        )

        return Response(serializer.data)

class PropertyOwnershipHistoryView(
    APIView
):

    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
        property_id
    ):

        transfers = (
            OwnershipTransfer.objects.filter(
                property_id=property_id
            )
        )

        serializer = (
            OwnershipTransferSerializer(
                transfers,
                many=True
            )
        )

        return Response(serializer.data)
    

class BlockchainTransactionsView(
    APIView
):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        transactions = (
            BlockchainPropertyTransaction
            .objects
            .all()
            .order_by("-id")
        )

        serializer = (
            BlockchainPropertyTransactionSerializer(
                transactions,
                many=True
            )
        )

        return Response(serializer.data)
    
from finance.models import (
    Escrow,
    PaymentTransaction,
    ReleaseRequest
)

from .models import OwnershipTransfer, BlockchainPropertyTransaction

class PropertyReceiptView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, property_id):

        try:

            # --------------------------------
            # PROPERTY
            # --------------------------------

            escrow = Escrow.objects.select_related(
                "property",
                "buyer",
                "seller"
            ).get(
                property_id=property_id
            )

        except Escrow.DoesNotExist:

            return Response(
                {
                    "error": "Escrow not found for this property."
                },
                status=status.HTTP_404_NOT_FOUND
            )


        # --------------------------------
        # OWNERSHIP TRANSFER
        # --------------------------------

        try:

            ownership = OwnershipTransfer.objects.select_related(
                "previous_owner",
                "new_owner",
                "property"
            ).get(
                property_id=property_id
            )

        except OwnershipTransfer.DoesNotExist:

            return Response(
                {
                    "error":
                    "Ownership transfer has not been completed yet."
                },
                status=status.HTTP_404_NOT_FOUND
            )


        # --------------------------------
        # PAYMENT TRANSACTIONS
        # --------------------------------

        payments = PaymentTransaction.objects.filter(
            escrow=escrow
        ).select_related(
            "buyer",
            "buyer_account"
        ).order_by(
            "created_at"
        )


        buyer_transactions = []

        for payment in payments:

            buyer_transactions.append(
                {
                    "transaction_id": payment.id,

                    "installment_no":
                        payment.installment_no,

                    "account_number":
                        (
                            payment.buyer_account.account_number
                            if payment.buyer_account
                            else None
                        ),

                    "amount":
                        str(payment.amount),

                    "transaction_type":
                        payment.transaction_type,

                    "status":
                        payment.status,

                    "created_at":
                        payment.created_at.strftime(
                            "%d %b %Y, %I:%M %p"
                        ),

                    "blockchain_tx_hash":
                        payment.blockchain_tx_hash
                }
            )


        # --------------------------------
        # SELLER RELEASES
        # --------------------------------

        releases = ReleaseRequest.objects.filter(
            escrow=escrow,
            seller=escrow.seller,
            status="approved"
        ).select_related(
            "seller",
            "bank_account"
        ).order_by(
            "id"
        )


        seller_releases = []

        for release in releases:

            seller_releases.append(
                {
                    "release_id":
                        release.id,

                    "account_number":
                        (
                            release.bank_account.account_number
                            if release.bank_account
                            else None
                        ),

                    "amount":
                        str(release.requested_amount),

                    "status":
                        release.status,

                    # ReleaseRequest model mein date field nahi hai
                    "date": None,
                    "time": None
                }
            )


        # --------------------------------
        # BLOCKCHAIN TRANSACTION
        # --------------------------------

        blockchain_transaction = (
            BlockchainPropertyTransaction.objects
            .filter(
                property_id=property_id
            )
            .first()
        )


        blockchain_data = None

        if blockchain_transaction:

            blockchain_data = {
                "transaction_hash":
                    blockchain_transaction.blockchain_tx_hash,

                "created_at":
                    blockchain_transaction.created_at.strftime(
                        "%d %b %Y, %I:%M %p"
                    )
            }


        # --------------------------------
        # RESPONSE
        # --------------------------------

        return Response(
            {
                "property": {

                    "id":
                        escrow.property.id,

                    "title":
                        escrow.property.title,

                    "type":
                        escrow.property.type,

                    "price":
                        str(escrow.property.price),

                    "city":
                        escrow.property.city,

                    "address":
                        escrow.property.full_address
                },


                "buyer": {

                    "username":
                        escrow.buyer.username,

                    "email":
                        escrow.buyer.email,

                    "phone":
                        getattr(
                            escrow.buyer,
                            "phone",
                            None
                        )
                },


                "seller": {

                    "username":
                        escrow.seller.username,

                    "email":
                        escrow.seller.email,

                    "phone":
                        getattr(
                            escrow.seller,
                            "phone",
                            None
                        )
                },


                "buyer_transactions":
                    buyer_transactions,


                "seller_releases":
                    seller_releases,


                "financial_summary": {

                    "property_price":
                        str(escrow.property_price),

                    "total_payable":
                        str(escrow.total_payable),

                    "total_paid":
                        str(escrow.total_received),

                    "total_released":
                        str(escrow.total_released),

                    "commission_required":
                        str(escrow.commission_required),

                    "commission_collected":
                        str(escrow.commission_amount)
                },


                "ownership": {

                    "previous_owner":
                        ownership.previous_owner.username
                        if ownership.previous_owner
                        else None,

                    "new_owner":
                        ownership.new_owner.username
                        if ownership.new_owner
                        else None,

                    "status":
                        ownership.status,

                    "transferred_at":
                        ownership.transferred_at.strftime(
                            "%d %b %Y, %I:%M %p"
                        ),

                    "blockchain_tx_hash":
                        ownership.blockchain_tx_hash
                },


                "blockchain":
                    blockchain_data
            }
        )