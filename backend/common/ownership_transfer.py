from ownership.models import (
    OwnershipTransfer,
    BlockchainPropertyTransaction
)

from common.blockchain_utils import BlockchainService

blockchain = BlockchainService()


def transfer_property_ownership(escrow):

    property_obj = escrow.property

    if OwnershipTransfer.objects.filter(
        property=property_obj
    ).exists():
        return None

    if escrow.buyer is None:
        raise Exception("Buyer not found.")

    previous_owner = escrow.seller
    new_owner = escrow.buyer
    
    # print("Property ID:", property_obj.id)
    # print("Previous Owner:", previous_owner)
    # print("Previous Owner UUID:", str(previous_owner.user_id))
    # print("New Owner:", new_owner)
    # print("New Owner UUID:", str(new_owner.user_id))
    # print("Property Price:", escrow.property_price)
    # print("Total Payable:", escrow.total_payable)
    # print("Commission Required:", escrow.commission_required)
    # print("Commission Completed:", escrow.commission_completed)
    # print("Total Released:", escrow.total_released)

    tx_hash = (
        blockchain.store_property_transaction(
            property_obj.id,
            str(previous_owner.user_id),
            str(new_owner.user_id),
            int(escrow.total_payable),
            int(escrow.commission_required)
        )
    )

    BlockchainPropertyTransaction.objects.create(
        property=property_obj,
        previous_owner=previous_owner,
        new_owner=new_owner,
        total_paid=int(
            escrow.total_payable
        ),
        commission=int(
            escrow.commission_required
        ),
        blockchain_tx_hash=tx_hash
    )

    transfer = OwnershipTransfer.objects.create(
        property=property_obj,
        previous_owner=previous_owner,
        new_owner=new_owner,
        escrow=escrow,
        status="completed",
        blockchain_tx_hash=tx_hash
    )

    property_obj.owner = new_owner
    property_obj.status = "sold"
    property_obj.save()

    return transfer