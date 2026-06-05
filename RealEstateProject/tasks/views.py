from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from rest_framework import status
from .models import Task,Agent
from .serializers import TaskSerializer,TaskListSerializer,TaskDetailSerializer,TaskUpdateSerializer,AgentTaskSerializer,TaskCreateSerializer,ListAgentTasksSerializer
from common.permissions import IsManager,IsAgent
from rest_framework.permissions import IsAuthenticated


class TaskCreateView(APIView):
    #permission_classes = [AllowAny]
    permission_classes = [IsManager]

    def post(self, request):
        serializer = TaskCreateSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Task is created successfully","data": serializer.data},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




# Task List API (to view all assigned tasks of all agent) // manager task view .jsx
class TaskListView(APIView):
    permission_classes = [IsManager]
    def get(self, request):
        tasks = Task.objects.all()
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# VIEW ALL TASK OF AN AGENT API

class AgentTasksView(APIView):
    permission_classes = [IsAgent]

    def get(self, request):
        agent = get_object_or_404(Agent, user=request.user)

        tasks = Task.objects.filter(agent_id=agent.id)  # 🔥 FIX
        serializer = ListAgentTasksSerializer(tasks, many=True)
        return Response(serializer.data)

# view all details of specific task // agrent task details.jsx

class AgentTaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, taskId):
        try:
            task = Task.objects.select_related(
                'property', 'buyer', 'owner', 'agent'
            ).prefetch_related('meetings').get(id=taskId)
        except Task.DoesNotExist:
            return Response({'detail': 'Task not found'}, status=404)

        serializer = TaskDetailSerializer(task)
        return Response(serializer.data)


# Task Detail API
class TaskDetailView(APIView):
    permission_classes = [IsManager]

    def get(self, request, pk):
        try:
            task = Task.objects.get(id=pk)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = TaskDetailSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)



#update
class TaskUpdateView(APIView):
    permission_classes = [IsManager]


    def put(self, request, pk):
        try:
            task = Task.objects.get(id=pk)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = TaskUpdateSerializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Task updated successfully", "data": serializer.data},
                            status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            task = Task.objects.get(id=pk)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = TaskUpdateSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Task updated successfully", "data": serializer.data},
                            status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

