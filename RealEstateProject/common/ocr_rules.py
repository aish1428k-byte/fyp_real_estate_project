# import re

# OCR_RULES = {
#     "cnic": {
#         "keywords": [
#             "national identity",
#             "identity card",
#             "identity number",
#             "pakistan",
#             "gender",
#             "father"
#         ],
#         "patterns": [
#             r"\d{5}-\d{7}-\d"   # CNIC number
#         ],
#         "min_score": 3
#     },

#     "lease": {
#         "keywords": [
#             "lease agreement",
#             "tenant",
#             "landlord",
#             "rent",
#             "monthly rent",
#             "lease period",
#             "property address"
#         ],
#         "patterns": [
#             r"\d+\s*(months|month|years|year)",   # lease duration
#             r"rs\.?\s*\d+",                       # rent amount
#         ],
#         "min_score": 3
#     },

#     "property": {
#         "keywords": [
#             "property",
#             "plot",
#             "area",
#             "owner"
#         ],
#         "patterns": [
#         r"\d+\s*(months|month|years|year)",
#         r"(rs\.?|pkr)\s*\d+",
#         r"(usd|\$)\s*\d+"
#     ],
#         "min_score": 3
#     }
# }


import re

OCR_RULES = {

    # =========================================================
    # CNIC FRONT
    # =========================================================
    "cnic_front": {
        "keywords": [
            "national identity card",
            "pakistan",
            "name",
            "father name",
            "gender",
            "date of birth",
            "identity number"
        ],
        "patterns": [
            r"\d{5}-\d{7}-\d"
        ],
        "min_score": 3
    },

    # =========================================================
    # CNIC BACK
    # =========================================================
    "cnic_back": {
        "keywords": [
            "date of issue",
            "date of expiry",
            "signature",
            "holder signature",
            "pakistan"
        ],
        "patterns": [
            r"\d{2}\.\d{2}\.\d{4}",
            r"\d{5}-\d{7}-\d"
        ],
        "min_score": 2
    },

    # =========================================================
    # LEASE / SALE DEED
    # =========================================================
    "lease_sale": {
        "keywords": [
            "lease agreement",
            "sale deed",
            "tenant",
            "landlord",
            "buyer",
            "seller",
            "property address",
            "monthly rent"
        ],
        "patterns": [
            r"\d+\s*(months|month|years|year)",
            r"(rs\.?|pkr)\s*\d+"
        ],
        "min_score": 3
    },

    # =========================================================
    # KBC
    # =========================================================
    "kbc": {
        "keywords": [
            "kbc",
            "karachi building control",
            "building control",
            "approval",
            "construction"
        ],
        "patterns": [],
        "min_score": 2
    },

    # =========================================================
    # TRANSFER LETTER
    # =========================================================
    "transfer_letter": {
        "keywords": [
            "transfer letter",
            "transfer of ownership",
            "new owner",
            "previous owner",
            "transfer"
        ],
        "patterns": [],
        "min_score": 2
    },

    # =========================================================
    # SITE PLAN
    # =========================================================
    "site_plan": {
        "keywords": [
            "site plan",
            "plot size",
            "map",
            "layout",
            "dimensions",
            "north"
        ],
        "patterns": [],
        "min_score": 2
    },

    # =========================================================
    # DEMARCATION LETTER
    # =========================================================
    "demarcation": {
        "keywords": [
            "demarcation",
            "boundary",
            "survey",
            "plot boundary",
            "measurement"
        ],
        "patterns": [],
        "min_score": 2
    },

    # =========================================================
    # ALLOTMENT LETTER
    # =========================================================
    "allotment": {
        "keywords": [
            "allotment letter",
            "allotted",
            "member",
            "plot number",
            "scheme",
            "authority"
        ],
        "patterns": [],
        "min_score": 2
    },

    # =========================================================
    # POSSESSION LETTER
    # =========================================================
    "possession": {
        "keywords": [
            "possession letter",
            "handed over",
            "possession",
            "occupant",
            "property possession"
        ],
        "patterns": [],
        "min_score": 2
    }
}