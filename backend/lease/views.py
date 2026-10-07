from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .serializers import LeaseUploadSerializer
from .services import process_lease_upload
from users import models

class UploadLeaseView(APIView):

    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser
    ]

    def post(self, request):

        serializer = LeaseUploadSerializer(
            data=request.data
        )

        # serializer.is_valid(
        #     raise_exception=True
        # )


        print("\n========== OCR TEXT ==========")
        print(request.data)
        if not serializer.is_valid():
            print("SERIALIZER ERRORS:")
            print(serializer.errors)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        result = process_lease_upload(
            file=serializer.validated_data["file"],

            property_id=serializer.validated_data[
                "property_id"
            ],

            located_at=serializer.validated_data[
                "located_at"
            ],

            landlord=serializer.validated_data[
                "landlord"
            ],

            tenant=serializer.validated_data[
                "tenant"
            ],

            beginning_on=serializer.validated_data[
                "beginning_on"
            ],

            ending_on=serializer.validated_data[
                "ending_on"
            ],

            lease_amount=serializer.validated_data[
                "lease_amount"
            ],

            user=request.user,
        )

        if result["success"]:

            return Response(
                result,
                status=status.HTTP_201_CREATED
            )


        return Response(
            result,
            status=status.HTTP_400_BAD_REQUEST
        )
    

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Lease
from .serializers import LeaseListSerializer


class LeaseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        leases = Lease.objects.select_related(
            'property',
            'property__owner',
            'document'
        ).all()

        serializer = LeaseListSerializer(
            leases,
            many=True
        )

        return Response(serializer.data)