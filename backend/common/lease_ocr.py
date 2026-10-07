from datetime import datetime



def verify_lease_details(
    *,
    ocr_text,
    located_at,
    landlord,
    tenant,
    beginning_on,
    ending_on,
    lease_amount,
):

    
    text = str(ocr_text).lower()

    
    errors = []

    if landlord.lower() not in text:
        errors.append("Landlord name mismatch")

    if tenant.lower() not in text:
        errors.append("Tenant name mismatch")

    if located_at.lower() not in text:
        errors.append("Location mismatch")

    amount_text = str(int(float(lease_amount)))

    if amount_text not in text:
        errors.append("Lease amount mismatch")
        
    beginning_text = beginning_on.strftime("%m/%d/%Y")
    ending_text = ending_on.strftime("%m/%d/%Y")

    if beginning_text not in text:
        errors.append("Beginning date mismatch")

    if ending_text not in text:
        errors.append("Ending date mismatch")

    return {
        "is_valid": len(errors) == 0,
        "errors": errors
    }