

import re

OCR_RULES = {

    "cnic_front": {
        "keywords": [
            "national identity card",
            "national",
            "identity",
            "islamic",
            "republic",
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
        "min_score": 2 or 1
    },

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

    "transfer_letter": {
        "keywords": [
            "TRANSFER / MUTATION ORDER",
            "mutate the occupancy",
            "transfer of ownership",
            "new owner",
            "previous owner",
            "transfer"
        ],
        "patterns": [],
        "min_score": 2
    },

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

    "demarcation": {
        "keywords": [
            "demarcation Letter",
            "boundary",
            "survey",
            "plot boundary",
            "measurement",
            "Letter For Land Demarcation"
        ],
        "patterns": [],
        "min_score": 2
    },

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

    "possession": {
        "keywords": [
            "possession order",
            "POSSION ORDER NO",
            "handed over",
            "possession",
            "occupant",
            "property possession"
        ],
        "patterns": [],
        "min_score": 2
    }
}