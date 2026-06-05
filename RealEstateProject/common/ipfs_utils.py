# common/ipfs_utils.py
import requests
import os

IPFS_API_URL = "http://127.0.0.1:5001/api/v0/add"

def upload_to_ipfs(file_path):
    try:
        with open(file_path, "rb") as f:
            response = requests.post(
                IPFS_API_URL,
                files={"file": f}
            )

        response.raise_for_status()
        result = response.json()
        return result["Hash"]  # CID

    except Exception as e:
        raise Exception(f"IPFS upload failed: {str(e)}")



def get_ipfs_gateway_url(cid: str) -> str:
    """
    Convert CID into public gateway URL
    """
    base_url = os.getenv(
        "IPFS_GATEWAY_URL",
        "https://gateway.pinata.cloud/ipfs/"
    )
    return f"{base_url}{cid}"