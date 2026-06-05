from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

# from .models import Property, PropertyDocument
from .models import Property

from documents.models import PropertyDocument


from .serializers import PropertySerializer,PropertyListSerializer,AssignedAgentSerializer

from rest_framework.generics import ListAPIView, ListCreateAPIView, DestroyAPIView, UpdateAPIView
from rest_framework.permissions import AllowAny,IsAuthenticated

from django.db.models import Q
from django.shortcuts import get_object_or_404

import tempfile
import os
from common.ipfs_utils import upload_to_ipfs



class UserPropertyListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get properties of the logged-in user
        properties = Property.objects.filter(owner=request.user)
        serializer = PropertyListSerializer(properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)




class PropertyCreateView(APIView):
    permission_classes = [IsAuthenticated]


    def post(self, request):
        serializer = PropertySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(owner=self.request.user)  # 🔥 OWNER FROM TOKEN
            return Response(
                {
                    "Message": "Property Registered Successfully",
                    "data": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            {
                "Message": "Validation Error",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )



class PropertyidView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            property_obj = Property.objects.get(pk=pk, owner=request.user)
            serializer = PropertySerializer(property_obj)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Property.DoesNotExist:
            return Response(
                {"error": "Property not found"},
                status=status.HTTP_404_NOT_FOUND
            )





from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

class PropertyListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Property.objects.filter(status='available')

        search = request.query_params.get('search')
        city = request.query_params.get('city')
        type_ = request.query_params.get('type')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        bedrooms = request.query_params.get('bedrooms')
        min_area = request.query_params.get('min_area')

        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(street__icontains=search) |
                Q(full_address__icontains=search) |

                Q(city__icontains=search)
            )

        if city:
            qs = qs.filter(city__iexact=city)

        if type_:
            qs = qs.filter(type__iexact=type_)

        if min_price:
            qs = qs.filter(price__gte=min_price)

        if max_price:
            qs = qs.filter(price__lte=max_price)

        if bedrooms:
            qs = qs.filter(bedrooms=bedrooms)

        if min_area:
            qs = qs.filter(area_size__gte=min_area)

        serializer = PropertySerializer(qs, many=True)
        return Response(serializer.data)


class PropertyDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        property = get_object_or_404(Property, pk=pk)
        serializer = PropertySerializer(property)
        return Response(serializer.data)


class PropertySingleView(APIView):
    permission_classes = [AllowAny]  
    def get(self, request, pk):
        try:
            property_obj = Property.objects.get(pk=pk)
        except Property.DoesNotExist:
            return Response(
                {"detail": "Property not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PropertySerializer(property_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PropertyDestroyView(DestroyAPIView):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    lookup_field = "pk"

    def delete(self, request, pk=None):
        try:
            property_obj = Property.objects.get(pk = pk)
        except Property.DoesNotExist:
            return Response(
                {"error": "Property not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        property_obj.delete()

        return Response(
            {"message": "Property deleted successfully"},
            status=status.HTTP_200_OK
        )

class PropertyUpdateView(UpdateAPIView):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    lookup_field = "pk"     

    def put(self, request, pk= None):
        try:
            property_obj = Property.objects.get(pk = pk)

            serializer = PropertySerializer(property_obj, data=request.data)

            if serializer.is_valid():
                serializer.save()
                return Response(
                    {"message": "Property updated successfully", "data": serializer.data},
                    status=status.HTTP_200_OK
                )
            return Response({"Message":"Error"}, status=status.HTTP_400_BAD_REQUEST)



        except Property.DoesNotExist:
            return Response(
                {"error": "Property not found"},
                status=status.HTTP_404_NOT_FOUND
            )

#  used when a task is created and an agent is assigned to a task (mangaer create task)

class UserAssignedAgentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, property_id):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"error": "Property not found"}, status=404)

        if not property_obj.assigned_agent:
            return Response({"message": "No agent assigned yet"}, status=200)

        serializer = AssignedAgentSerializer(property_obj.assigned_agent)
        return Response(serializer.data, status=200)


# used to fetch the task_id of an assigned agent to view the meeting details (agent description [view meeting details btn])

class PropertyTaskAPIView(APIView):
    def get(self, request, property_id):
        try:
            # ✅ Use property__id instead of property_id
            task = Task.objects.filter(property__id=property_id).first()
            if not task:
                return Response({"detail": "No task found for this property"}, status=404)

            return Response({
                "task_id": task.ivsd,
                "task_number": task.task_number,
                "status": task.status,
            })
        except Exception as e:
            return Response({"detail": str(e)}, status=500)


class IPFSUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')
        property_id = request.data.get('property_id')

        if not file:
            return Response(
                {"error": "File is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not property_id:
            return Response(
                {"error": "property_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response(
                {"error": "Property not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        temp_file_path = None

        try:
            # Save file temporarily
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                for chunk in file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name

            # Upload to IPFS
            cid = upload_to_ipfs(temp_file_path)

            # Save CID to database
            PropertyDocument.objects.create(
                property=property_obj,
                cid=cid,
                uploaded_by=request.user
            )

            return Response(
                {
                    "message": "File uploaded to IPFS successfully",
                    "cid": cid
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
