# from generate_token import generate_token
import mimetypes
import os
import tempfile
# import jwt
import time
from datetime import datetime as dt

import requests
from core_app.aws_interface import *
from core_app.models import *
from core_app.recordings import (download_recording, get_meeting_attendance,
                                 get_meeting_recording)
from core_app.serializers import *
from core_app.vimeo_interface import change_video_meta, generate_upload_link
from core_app.zoom_interface import get_video_by_id
from django.conf import settings
# from django.http import JsonResponse
from django.contrib.auth import authenticate, get_user_model
from django.core import serializers
from django.core.files.storage import FileSystemStorage
from django.db.models import F, Q
from django.http.request import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.utils.timezone import now
from django_filters.rest_framework import DjangoFilterBackend
from django_zoom_meetings import ZoomMeetings
from LMS.utilization import html_send_mail
from rest_framework import filters, status
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.renderers import JSONRenderer, TemplateHTMLRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken

from .generate_token import *

# https://github.com/JoeyAlpha5/django-zoom-meetings

API_KEY = settings.API_KEY
API_SEC = settings.API_SEC

User = get_user_model()
access_till_id = 37
# Create your views here.


class signin(APIView):
    permission_classes = ()

    def post(self, request):
        received_json_data = request.data
        serializer = SignInSerializer(data=received_json_data)
        if serializer.is_valid():
            user = authenticate(
                request,
                username=received_json_data['username'],
                password=received_json_data['password'])
            if user is not None:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'type': "teacher" if user.is_staff else "student",
                    'admin': True if user.is_superuser else False
                }, status=200)
            else:
                return Response({
                    'message': 'invalid username or password',
                }, status=403)
        else:
            return Response({'message': serializer.errors}, status=400)


class RegisterUser(APIView):
    serializer_class = RegisterSerializer

    def post(self, request):
        data_ = None
        if "userData" in request.data:
            data_ = request.data['userData']
        else:
            data_ = request.data

        serializer = self.serializer_class(data=data_)
        if serializer.is_valid():
            first_name = serializer.validated_data['first_name']
            last_name = serializer.validated_data["last_name"]
            is_staff = serializer.validated_data["is_staff"]
            email = serializer.validated_data["email"]
            phone_number = serializer.validated_data["phone_number"]
            qualification = serializer.validated_data["qualification"]
            password = serializer.validated_data["password"]
            skills = serializer.validated_data["skills"]
            interested_categories = serializer.validated_data["interested_categories"]

            if User.objects.filter(username=email).exists():
                return Response({"message": "username already exists"},
                                status=400)

            user = User(
                first_name=first_name,
                last_name=last_name,
                is_staff=is_staff,
                email=email,
                username=email
            )
            user.set_password(password)
            user.save()
            if is_staff:
                teacher = Teacher(
                    user=user,
                    qualification=qualification,
                    phone_number=phone_number,
                    skills=skills
                )
                teacher.save()
            else:
                student = Student(
                    user=user,
                    interested_categories=interested_categories
                )
                student.save()

            return Response({"message": "success"},
                            status=200)
        else:
            return Response({"message": serializer.errors},
                            status=400)


class AddQuiz(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        data = None
        if "quizData" in request.data:
            data = request.data['quizData']
        else:
            data = request.data
        if data:
            teacher = Teacher.objects.get(user=user)
            if teacher:
                title = data['title']
                detail = data['detail']
                course_id = data['course_id']

                teacher_obj = Teacher.objects.get(user_id=request.user.id)
                course_obj = Course.objects.get(id=course_id)
                if Quiz.objects.filter(teacher=teacher_obj, title=title, is_deleted=False).exists():
                    return Response({'message': f'Quiz already present'}, status=200)

                quiz = Quiz(teacher=teacher_obj, title=title, detail=detail)
                quiz.save()

                course_quiz = CourseQuiz(course=course_obj, quiz=quiz)
                course_quiz.save()
                return Response({'message': f'Quiz saved for {teacher.user}'}, status=200)
            else:
                return Response({'message': f'Teacher not present'}, status=400)
        else:
            return Response({'message': 'Empty payload !'}, status=400)

    def get(self, request):
        if request.user.is_staff:
            data = Quiz.objects.filter(is_deleted=False)
        else:
            data = Quiz.objects.filter(
                teacher__user_id=request.user.id, is_deleted=False)
        serializer = QuizSerializer(data, many=True)
        # if serializer.data:
        return Response({"data": serializer.data}, status=200)

    def put(self, request, quiz_id=None):
        # if serializer.data:
        # return Response({"data":serializer.data},status=200)
        try:
            # course = Course.objects.get(id=course_id,is_deleted=False)
            quiz = Quiz.objects.get(id=quiz_id, is_deleted=False)

            if quiz:
                serializer = QuizSerializer(
                    quiz, data=request.data['quizData'], partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response({"message": "Updated Successfully", "data": serializer.data})
                else:
                    return Response({"message": "Invalid Data"}, status=400)
            else:
                return Response({"message": "Invalid Quiz ID"}, status=400)

        except Exception as e:
            return Response({"message": "Something went wrong!!", "error": e}, status=500)

    def delete(self, request, quiz_id=None):
        try:
            # course = Course.objects.get(id=course_id,is_deleted=False)
            quiz = Quiz.objects.get(id=quiz_id, is_deleted=False)

            if quiz:
                serializer = QuizSerializer(
                    quiz, data={"is_deleted": True}, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response({"message": "Deleted Successfully", "data": serializer.data})
                else:
                    return Response({"message": "Invalid Data"}, status=400)
            else:
                return Response({"message": "Invalid Quiz ID"}, status=400)

        except Exception as e:
            return Response({"message": "Something went wrong!!", "error": e}, status=500)

        # else:
        #     return Response({"message":serializer.errors},status=400)


class AddModuleQuiz(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        data = None
        if "quizData" in request.data:
            data = request.data['quizData']
        else:
            data = request.data
        if data:
            teacher = Teacher.objects.get(user=user)
            if teacher:
                try:
                    title = data['title']
                    detail = data['detail']
                    module_id = data['module_id']
                    course_id = data['course_id']

                    teacher_obj = Teacher.objects.get(user_id=request.user.id)
                    module_obj = Module.objects.get(id=module_id)
                    course_obj = Course.objects.get(id=course_id)
                    if Quiz.objects.filter(teacher=teacher_obj, title=title, is_deleted=False).exists():
                        return Response({'message': f'Quiz already present'}, status=200)

                    quiz = Quiz(teacher=teacher_obj,
                                title=title, detail=detail)
                    quiz.save()
                    try:
                        course_quiz = CourseQuiz(course=course_obj, quiz=quiz)
                        course_quiz.save()
                    except Exception as e:
                        print(e)
                    module_quiz = ModuleQuiz(module=module_obj, quiz=quiz)
                    module_quiz.save()
                    return Response({'message': f'Quiz saved for {teacher.user}'}, status=200)
                except Exception as e:
                    print(e)
            else:
                return Response({'message': f'Teacher not present'}, status=400)
        else:
            return Response({'message': 'Empty payload !'}, status=400)

    def put(self, request, quiz_id=None):
        # if serializer.data:
        # return Response({"data":serializer.data},status=200)
        try:
            # course = Course.objects.get(id=course_id,is_deleted=False)
            quiz = Quiz.objects.get(id=quiz_id, is_deleted=False)

            if quiz:
                serializer = QuizSerializer(
                    quiz, data=request.data['quizData'], partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response({"message": "Updated Successfully", "data": serializer.data})
                else:
                    return Response({"message": "Invalid Data"}, status=400)
            else:
                return Response({"message": "Invalid Quiz ID"}, status=400)

        except Exception as e:
            return Response({"message": "Something went wrong!!", "error": e}, status=500)


class AddQuizQuestions(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = None
        if "quizData" in request.data:
            data = request.data['quizData']
        else:
            data = request.data

        serializer = QuizQuestionSerializer(data=data)
        if serializer.is_valid():
            try:
                quiz_obj = Quiz.objects.get(
                    id=serializer.validated_data['quiz_id'], teacher__user_id=user.id)
            except:
                return Response({"message": "quiz not found with this id"}, status=200)

            questions = serializer.validated_data['questions']
            ans1 = serializer.validated_data['ans1']
            ans2 = serializer.validated_data['ans2']
            ans3 = serializer.validated_data['ans3']
            ans4 = serializer.validated_data['ans4']
            right_ans = serializer.validated_data['right_ans']
            if QuizQuestions.objects.filter(questions=questions, quiz=quiz_obj, is_deleted=False).exists():
                return Response({'message': f'{questions} ? Question already exists'}, status=200)

            quiz_que = QuizQuestions(
                quiz=quiz_obj,
                questions=questions,
                ans1=ans1,
                ans2=ans2,
                ans3=ans3,
                ans4=ans4,
                right_ans=right_ans
            )
            quiz_que.save()
            return Response({'message': 'quiz question added'}, status=200)
        else:
            return Response({'message': serializer.errors}, status=400)

    def get(self, request):
        users_quiz = Quiz.objects.filter(
            teacher__user_id=request.user.id, is_deleted=False)
        quiz_question = []
        for quiz in users_quiz:
            data = QuizQuestions.objects.filter(quiz=quiz)
            serializer = QuizQuestionsSerializer(data, many=True)
            quiz_question.append({quiz.title: serializer.data})

        return Response({'data': quiz_question}, status=200)

    def put(self, request, quiz_question_id=None):
        try:
            quiz_question = QuizQuestions.objects.get(
                id=quiz_question_id, is_deleted=False)
            serializer = QuizQuestionsSerializer(
                quiz_question, data=request.data['quizData'], partial=True)
            if (serializer.is_valid()):
                serializer.save()
                return Response({"message": "Question Updated", "data": serializer.data}, status=200)
            else:
                return Response({"message": "Invalid Data"}, status=400)
        except Exception as e:
            return Response({"message": "Something went wrong!!", "error": e}, status=500)

    def delete(self, request, quiz_question_id=None):
        try:
            quiz_question = QuizQuestions.objects.get(
                id=quiz_question_id, is_deleted=False)
            serializer = QuizQuestionsSerializer(
                quiz_question, data={"is_deleted": True}, partial=True)
            if (serializer.is_valid()):
                serializer.save()
                return Response({"message": "Question Deleted", "data": serializer.data}, status=200)
            else:
                return Response({"message": "Invalid Data"}, status=400)
        except Exception as e:
            return Response({"message": "Something went wrong!!", "error": e}, status=500)


class AddCourseCategory(APIView):
    serializer_class = CourseCategorySerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Course cateogery created"}, status=200)
        else:
            return Response({"message": serializer.errors}, status=200)

    def get(self, request):
        course_cat = CourseCategory.objects.all()
        serializer = self.serializer_class(course_cat, many=True)
        if serializer.data:
            return Response({"data": serializer.data}, status=200)
        else:
            return Response({"message": "No cateogeries present"}, status=204)


class AddCourse(APIView):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_ = request.user
        data = None
        if "courseData" in request.data:
            data = request.data['courseData']
        else:
            data = request.data

        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            category_id = serializer.validated_data['category_id']
            title = serializer.validated_data['title']
            description = serializer.validated_data['description']

            if Course.objects.filter(category_id=category_id, teacher__user_id=user_.id, title=title, is_deleted=False).exists():
                return Response({"message": "Course already created with same title"}, status=400)

            teacher_obj = Teacher.objects.get(user_id=user_.id)
            course_ = Course(category_id=category_id,
                             teacher=teacher_obj,
                             title=title, description=description)
            course_.save()

            return Response({"message": "Course created", "data": course_.id}, status=200)
        else:
            return Response({"message": serializer.errors}, status=400)

    def get(self, request):
        if request.user.is_superuser:
            course_data = Course.objects.filter(
                is_deleted=False, course_detail__isnull=False).order_by('-course_detail__created_at')
        elif request.user.is_staff:
            course_data = Course.objects.filter(
                teacher__user_id=request.user.id, is_deleted=False, course_detail__isnull=False).order_by('-course_detail__created_at')
        else:
            course_data = Course.objects.filter(
                enrolled_student_courses__student__user=request.user.id)
        serializer = CourseSerializerList(course_data, many=True)
        if serializer.data:
            return Response({"data": serializer.data}, status=200)
        else:
            return Response({"message": "No content"}, status=204)

    def put(self, request, course_id=None):
        try:
            course = Course.objects.get(id=course_id, is_deleted=False)
            if course:
                serializer = CourseSerializerList(
                    course, data=request.data['courseData'], partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response({"message": "Updated Successfully", "data": serializer.data})
                else:
                    return Response({"message": "Invalid Data"}, status=400)
            else:
                return Response({"message": "Invalid Course ID"}, status=400)

        except Exception as e:
            return Response({"message": "Something went wrong!!", "error": e}, status=500)

    def delete(self, request, course_id=None):
        try:
            course = Course.objects.get(id=course_id, is_deleted=False)
            if course:
                serializer = CourseSerializerList(
                    course, data={"is_deleted": True}, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response({"message": "Course Deleted Successfully", "data": serializer.data})
                else:
                    return Response({"message": "Invalid Data"}, status=400)
            else:
                return Response({"message": "Invalid Course ID"}, status=400)

        except Exception as e:
            return Response({"message": "Something went wrong!!", "error": e}, status=500)


class ModuleViewSet(ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['course']
    search_fields = ('=course')

    queryset = Module.objects.all()

    def get_queryset(self):
        if Teacher.objects.filter(user=self.request.user).exists():
            return Module.objects.filter(teacher=get_object_or_404(Teacher, user=self.request.user))
        return super().get_queryset()

    def create(self, request, *args, **kwargs):
        """
        Create a new module
        """
        teacher = get_object_or_404(Teacher, user_id=request.user.id)
        request.data['teacher'] = teacher.id
        serializer = ModuleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_417_EXPECTATION_FAILED)


class AddCourseQuiz(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CourseQuizSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "course quiz is created"}, status=200)
        else:
            return Response({"message": serializer.errors}, status=400)


class AddAssignment(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AssignmentSerializer

    def post(self, request):
        user = request.user
        data = None
        if "data" in request.data:
            data = request.data['data']
        else:
            data = request.data

        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            # file = serializer.validated_data['file']
            # print(file.name)

            if Assignment.objects.filter(teacher_id=user.id,
                                         title=serializer.validated_data['title'], is_deleted=False).exists():
                return Response({"message": "Assignment already added for the current student"},
                                status=200)

            teacher_obj = Teacher.objects.get(user_id=user.id)
            module = Module.objects.get(
                id=serializer.validated_data['module'])

            assignment = Assignment(
                teacher=teacher_obj,
                module=module,
                title=serializer.validated_data['title'],
                question=serializer.validated_data['question']
            )
            assignment.save()

            return Response({"message": "assignment is created", "data": assignment.id}, status=200)
        else:
            return Response({"message": serializer.errors}, status=400)

    def get(self, request):
        data = Assignment.objects.filter(
            teacher__user_id=request.user.id, is_deleted=False)
        # data = Assignment.objects.filter(teacher__user_id=request.user.id).annotate(course_name=F('course__title')).values('id','title','teacher','question','course_name')
        serializer = AssignmentListSerializer(data, many=True)
        if serializer.data:
            return Response({"data": serializer.data}, status=200)
        else:
            return Response({"message": "data not found"}, status=204)

    def put(self, request, assignment_id=None):
        try:
            assignent = Assignment.objects.get(
                id=assignment_id, is_deleted=False)
            if assignent:
                serializer = AssignmentListSerializer(
                    assignent, data=request.data['data'], partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response({"message": "Updated Successfully", "data": serializer.data})
                else:
                    return Response({"message": "Invalid Data"}, status=400)
            else:
                return Response({"message": "Invalid Assignment ID"}, sstatus=400)

        except Exception as e:
            return Response({"message": "Something went wrong!!", "error": e}, status=500)

    def delete(self, request, assignment_id=None):
        try:
            assignent = Assignment.objects.get(
                id=assignment_id, is_deleted=False)
            if assignent:
                serializer = AssignmentListSerializer(
                    assignent, data={"is_deleted": True}, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response({"message": "Assignment Deleted Successfully", "data": serializer.data})
                else:
                    return Response({"message": "Invalid Data"}, status=400)
            else:
                return Response({"message": "Invalid Assignemnt ID"}, status=400)

        except Exception as e:
            return Response({"message": "Something went wrong!!", "error": e}, status=500)


class EnrollStudent(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EnrollStudentSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "student enorlled for the course"}, status=200)
        else:
            return Response({"message": serializer.errors}, status=400)


class StudentList(APIView):
    # permission_classes = [IsAuthenticated]
    def get(self, request, username=None):
        if username:
            try:
                student = Student.objects.filter(user__username=username).values('id', 'user__id', 'user__username',
                                                                                 'user__first_name',
                                                                                 'user__last_name',
                                                                                 'interested_categories', 'emi_option')
                if student.exists():
                    return Response({"data": student[0]}, status=status.HTTP_200_OK)
                else:
                    return Response({"data": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                print(e)
        else:
            if request.user.is_staff:
                student_list = Student.objects.all().values('user__id', 'user__username',
                                                            'user__first_name',
                                                            'user__last_name',
                                                            'interested_categories')
            else:
                if Teacher.objects.filter(user=request.user):
                    teacher = get_object_or_404(
                        Teacher, user_id=request.user.id)
                    student_list = Student.objects.filter(user__is_staff=False, enrolled_student_id__teacher__id=teacher.id).values('user__id', 'user__username',
                                                                                                                                    'user__first_name',
                                                                                                                                    'user__last_name',
                                                                                                                                    'interested_categories')
                else:
                    student_list = Student.objects.all().values('user__id', 'user__username',
                                                                'user__first_name',
                                                                'user__last_name',
                                                                'interested_categories')
            student_list_ = [k for k in student_list]
            return Response({"data": student_list_}, status=200)


class CreateMeeting(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CreateMeetingSerializer

    def post(self, request):
        my_zoom = ZoomMeetings(API_KEY, API_SEC, "contact@sambodhi.co.in")
        seriailizer = self.serializer_class(data=request.data)
        if seriailizer.is_valid():
            topic = seriailizer.validated_data['topic']
            duration = seriailizer.validated_data['duration']
            password = seriailizer.validated_data['password']
            course_id = seriailizer.validated_data['course_id']

            create_meeting = my_zoom.CreateMeeting(dt.now(),
                                                   topic,
                                                   duration,
                                                   password
                                                   )

            try:
                teacher_obj = Teacher.objects.get(user_id=request.user.id)
                meeting_url = create_meeting['join_url']
                meeting = TeacherMeeting(
                    teacher=teacher_obj,
                    course_id=course_id,
                    start_url=create_meeting['start_url'],
                    meeting_link=meeting_url,
                    meeting_id=create_meeting['id'],
                    password=password,
                    topic=topic
                )
                meeting.save()

                responses_dict = {
                    "start_url": create_meeting['start_url'],
                    "meeting_id": create_meeting['id']
                }
                return Response({"data": responses_dict}, status=200)
            except Exception as e:
                return Response({"message": "zoom issue", "error": e}, status=400)

        return Response({'message': seriailizer.errors}, status=400)

    def get(self, request):
        data = TeacherMeeting.objects.filter(
            teacher__user_id=request.user.id).last()
        serializer = TeacherMeetingSerializer(data)
        if serializer.data:
            return Response({"data": serializer.data}, status=200)
        else:
            return Response({"message": "no content"}, status=204)


# class StudentMeetingList(APIView):
#     def get(self, request):
#         # data = TeacherMeeting.objects.all().last()
#         data = TeacherMeeting.objects.filter(course__in=Course.objects.filter(
#             is_deleted=False, id__in=StudentCourse.objects.filter(student=request.user.id))).last()
#         serializer = StudentMeetingSerializer(data)
#         if serializer.data:
#             return Response({"data": serializer.data}, status=200)
#         else:
#             return Response({"message": "no content"}, status=204)
class StudentMeetingList(APIView):
    def get(self, request):
        if request.user.id is None or request.user.id > access_till_id:
            return Response({"message": "success", "data": []}, status=200)
        data = TeacherMeeting.objects.all().last()
        serializer = StudentMeetingSerializer(data)
        if serializer.data:
            return Response({"data": serializer.data}, status=200)
        else:
            return Response({"message": "no content"}, status=204)


class UserProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = User.objects.get(id=request.user.id)
            data = dict()
            data['id'] = user.id
            data['username'] = user.username
            data['first_name'] = user.first_name
            data['last_name'] = user.last_name
            data['is_superuser'] = user.is_superuser
            if user.is_staff:
                teacher = Teacher.objects.get(user_id=request.user.id)
                data['qualification'] = teacher.qualification
                data['phone_number'] = teacher.phone_number
                data['skills'] = teacher.skills
            else:
                student = Student.objects.get(user_id=request.user.id)
                data['interested_categories'] = student.interested_categories

            return Response({"data": data}, status=200)
        except Exception as e:
            return Response({"message": "No user found with this credential"}, status=400)


class StudentSubmitAssignment(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        if data:
            teacher_id = data['teacher']
            assignment_id = data['assignment']
            assignment_answer = data['answer']

            teacher_obj = Teacher.objects.get(user_id=teacher_id)
            student_obj = Student.objects.get(user_id=request.user.id)

            assignmnet_sub = StudentAssignmentSubmission(
                student=student_obj,
                teacher=teacher_obj,
                assignment_id=assignment_id,
                student_assignment_status=True,
                answer=assignment_answer
            )
            assignmnet_sub.save()

            return Response({"message": "assignment submited"}, status=200)
        else:
            return Response({"message": "empty body !"}, status=400)


class StudentViewAssignments(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # course_enrolled = StudentCourseEnrollment.objects.get(student_id=request.user.id)
        # assignment = Assignment.objects.filter(teacher_id=course_enrolled.teacher,
        # course=course_enrolled.course)
        student_assignment_data = []
        assignments = Assignment.objects.all()
        for assignment in assignments:
            id = assignment.id
            teacher = assignment.teacher
            submission_status = False
            if StudentAssignmentSubmission.objects.filter(teacher=teacher,
                                                          assignment=assignment, student__user_id=request.user.id,
                                                          student_assignment_status=True
                                                          ).exists():
                submission_status = True

            student_assignment_data.append(
                {
                    "teacher": teacher.id,
                    "course": "",
                    "title": assignment.title,
                    "question": assignment.question,
                    "assignment_status": submission_status
                }
            )

        # serializer = AssignmentListSerializer(assignment, many=True)
        if student_assignment_data:
            return Response({"data": student_assignment_data}, status=200)
        else:
            return Response({"message": "No data"}, status=400)


class StudentQuizList(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student_obj = Student.objects.get(user_id=request.user.id)
        users_quiz = Quiz.objects.filter(is_deleted=False, id__in=list(CourseQuiz.objects.filter(
            course__in=list(Course.objects.filter(is_deleted=False, id__in=list(
                StudentCourse.objects.filter(student=student_obj.id).values_list('course', flat=True))).values_list('id', flat=True))).values_list('quiz', flat=True)))
        serializer = QuizSerializer(users_quiz, many=True)
        for idx, x in enumerate(serializer.data):
            student_quiz = StudentQuizDetails.objects.filter(
                quiz=users_quiz[idx].pk, student=student_obj.pk)
            serializer.data[idx]['is_submitted'] = student_quiz.exists()
            serializer.data[idx]['score'] = student_quiz[0].score if student_quiz.exists(
            ) else None
        # is_submitted=StudentQuizDetails()
        if serializer.data:
            return Response({"data": serializer.data}, status=200)

        else:
            return Response({"message": "no content"}, status=204)


class StudentQuizQuestions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id = request.GET.get("id")
        data = QuizQuestions.objects.filter(quiz_id=id, is_deleted=False)
        serializer = QuizQuestionsSerializer(data, many=True)
        if serializer.data:
            return Response({"data": serializer.data}, status=200)
        else:
            return Response({"message": "no content"}, status=204)


class StudentQuizSubmission(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StudentQuizQuestionsSubmissionSer(data=request.data)
        if serializer.is_valid():
            quiz_ = serializer.validated_data['quiz']
            teacher_ = serializer.validated_data['teacher']
            quiz_question = serializer.validated_data['quiz_question']
            answer = serializer.validated_data['answer']
            result = False
            # teacher_obj = Teacher.objects.get(user_id=teacher_)
            quiz_obj = Quiz.objects.get(id=quiz_)
            quiz_question_obj = QuizQuestions.objects.get(id=quiz_question)
            student_obj = Student.objects.get(user_id=request.user.id)
            if quiz_question_obj.right_ans == answer:
                result = True
            submission = StudentQuizQuestionsSubmission(
                student=student_obj,
                quiz=quiz_obj,
                teacher=quiz_obj.teacher,
                quiz_question=quiz_question_obj,
                answer=answer,
                submission_status=True,
                result=result
            )
            submission.save()

            return Response({'message': 'Quiz submitted successfully'}, status=200)
        else:
            return Response({'message': serializer.errors}, status=400)


class StudendAssignmentList(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student_assignment_data = []
        student = Student.objects.get(user=request.user)
        assignments = Assignment.objects.filter(
            is_deleted=False, module__course__in=list(StudentCourse.objects.filter(student=student).values_list('course', flat=True)))
        for assignment in assignments:
            id = assignment.id
            teacher = assignment.teacher
            submission_status = False
            student_assignment_submit = StudentAssignmentSubmission.objects.filter(teacher=teacher,
                                                                                   assignment=assignment, student__user_id=request.user.id,
                                                                                   student_assignment_status=True
                                                                                   )
            grade = None
            if student_assignment_submit.exists():
                submission_status = True
                grade = student_assignment_submit.last().grade

            student_assignment_data.append(
                {
                    "teacher": teacher.user.id,
                    "module": "",
                    "title": assignment.title,
                    "id": assignment.id,
                    "question": assignment.question,
                    "assignment_status": submission_status,
                    "grade": grade
                }
            )

        # serializer = AssignmentListSerializer(assignment, many=True)
        if student_assignment_data:
            return Response({"data": student_assignment_data}, status=200)
        else:
            return Response({"message": "No data"}, status=400)


class get_recording_student(APIView):
    # permission_classes = [IsAuthenticated]
    def get_meeting_id(self, request):
        # enrolled_teacher_info = StudentCourseEnrollment.objects.get(id=request.user.id)
        # teacher_meeting_info = TeacherMeeting.objects.filter(teacher=enrolled_teacher_info.teacher)
        teacher_meeting_info = TeacherMeeting.objects.filter(teacher_id=2)
        serializer = StudentMeetingSerializer(teacher_meeting_info, many=True)
        meeting_id = [meeting_id['meeting_id']
                      for meeting_id in serializer.data]
        return meeting_id

    def get(self, request):
        token_ = request_token
        base_url = "https://api.zoom.us/v2"
        meeting_ids = self.get_meeting_id(request)
        records_urls = []
        for meet_id in meeting_ids:
            url = base_url + "/meetings/" + str(meet_id) + "/recordings"
            response = requests.get(
                url, headers={'Authorization': 'Bearer ' + token_})
            response = response.json()

            if 'code' in response:
                records_urls.append({"meet_id": meet_id, "record_url": ""})
            else:
                play_url = response['recording_files'][0]['play_url']
                records_urls.append(
                    {"meet_id": meet_id, "record_url": play_url})

        return Response({"data": records_urls}, status=200)


class CourseMatrialFileUpload(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id=None, format=None):
        course_obj = Course.objects.get(id=course_id)
        files_list = get_assessment_files(
            f'Material/Course/{course_obj.teacher.user.id}/', course_id)
        return Response({"message": "Success", "list": files_list}, status=200)

    def post(self, request, material_type=None, course_id=None, format=None):
        if course_id is None:
            return Response({"message": "Course Id is required"}, status=400)
        try:
            course_obj = Course.objects.get(id=int(course_id))
            teacher_obj = Teacher.objects.get(user_id=request.user)

            files = request.FILES['file']
            file_name = str(int(time.time()) * 1000)+"_"+files.name
            file_path = 'Material/Course/%s/%s/%s' % (
                teacher_obj.user.id, course_id, file_name)

            upload_status = upload_assessment_file(files, file_path)
            if upload_status:
                if not CourseMaterial.objects.filter(
                    course=course_obj,
                    teacher=teacher_obj,
                    material_url=file_path
                ).exists():
                    course_material = CourseMaterial(
                        course=course_obj,
                        teacher=teacher_obj,
                        material_url=file_path
                    )
                course_material.save()
                return Response({"message": "File Uploaded Successfully", "path": file_path}, status=200)
            else:
                return Response({"message": "Failed to upload"}, status=400)
        except Course.DoesNotExist:
            return Response({"status": status.HTTP_404_NOT_FOUND, "message": "Course doesn't exist"}, status=status.HTTP_404_NOT_FOUND)


class StudentCourseMaterialList(APIView):

    def get(self, request):
        try:
            try:
                stu = get_object_or_404(Student, user_id=request.user.id)
                course_material = CourseMaterial.objects.filter(
                    course__in=list(Course.objects.filter(is_deleted=False, id__in=list(StudentCourse.objects.filter(student=stu.id).values_list("course", flat=True))).values_list("id", flat=True)))
            except Exception:
                if request.user.is_staff:
                    course_material = CourseMaterial.objects.filter(course__in=list(
                        Course.objects.filter(is_deleted=False)))
                else:
                    teacher = get_object_or_404(
                        Teacher, user_id=request.user.id)
                    course_material = CourseMaterial.objects.filter(course__in=list(
                        Course.objects.filter(is_deleted=False, teacher__id=teacher.id)))
            unique_course = dict()
            for material in course_material:
                url = material.material_url.split('/')
                url.pop()
                course_id = url.pop()
                prefix_path = "/".join(url)+"/"
                files_list = get_assessment_files(prefix_path, course_id)
                if material.course.title not in unique_course:
                    unique_course[material.course.title] = files_list

            files_list_ = [{"course_name": key, "file_list": value}
                           for key, value in unique_course.items()]
            return Response({"message": "success", "data": files_list_}, status=200)
        except Assignment.DoesNotExist:
            return Response({"message": "Assignment Material list is empty "}, status=204)


class ModuleMatrialFileUpload(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, module_id=None, format=None):
        module_obj = Module.objects.get(id=module_id)
        files_list = get_assessment_files(
            f'Material/Module/{module_obj.course.id}/', module_id)
        return Response({"message": "Success", "list": files_list}, status=200)

    def post(self, request, material_type=None, module_id=None, format=None):
        if module_id is None:
            return Response({"message": "module id is required"}, status=400)
        try:
            module_obj = Module.objects.get(id=int(module_id))

            files = request.FILES['file']
            file_name = str(int(time.time()) * 1000)+"_"+files.name
            file_path = 'Material/Module/%s/%s/%s' % (
                module_obj.course.id, module_id, file_name)

            upload_status = upload_assessment_file(files, file_path)
            if upload_status:
                if not ModuleMaterial.objects.filter(
                    module=module_obj,
                    material_url=file_path
                ).exists():
                    module_material = ModuleMaterial(
                        module=module_obj,
                        material_url=file_path
                    )
                module_material.save()
                return Response({"message": "File Uploaded Successfully", "path": file_path}, status=200)
            else:
                return Response({"message": "Failed to upload"}, status=400)
        except Course.DoesNotExist:
            return Response({"status": status.HTTP_404_NOT_FOUND, "message": "Module doesn't exist"}, status=status.HTTP_404_NOT_FOUND)


class StudentModuleMaterialList(APIView):

    def get(self, request):
        try:
            try:
                stu = get_object_or_404(Student, user_id=request.user.id)
                module_material = ModuleMaterial.objects.filter(module__in=list(Module.objects.filter(
                    course__in=list(Course.objects.filter(is_deleted=False, id__in=list(StudentCourse.objects.filter(student=stu.id).values_list("course", flat=True))).values_list("id", flat=True)))))
            except Exception:
                if request.user.is_superuser:
                    module_material = ModuleMaterial.objects.filter(module__in=list(
                        Module.objects.filter(is_deleted=False)))
                else:
                    teacher = get_object_or_404(
                        Teacher, user_id=request.user.id)
                    module_material = ModuleMaterial.objects.filter(module__in=list(
                        Module.objects.filter(is_deleted=False, teacher__id=teacher.id)))
            unique_module = dict()
            for material in module_material:
                url = material.material_url.split('/')
                url.pop()
                module_id = url.pop()
                prefix_path = "/".join(url)+"/"
                files_list = get_assessment_files(prefix_path, module_id)
                if material.module.title not in unique_module:
                    unique_module[material.module.title] = files_list

            files_list_ = [{"module_name": key, "file_list": value}
                           for key, value in unique_module.items()]
            return Response({"message": "success", "data": files_list_}, status=200)
        except Assignment.DoesNotExist:
            return Response({"message": "Assignment Material list is empty "}, status=204)


class AssignmentMatrialFileUpload(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, assignment_id=None, format=None):
        try:
            assignment_obj = Assignment.objects.get(id=assignment_id)
            files_list = get_assessment_files(
                f'Material/Assignment/{assignment_obj.teacher.user.id}/', assignment_id)
            return Response({"message": "Success", "list": files_list}, status=200)
        except Assignment.DoesNotExist:
            return Response({"message": "Assignment Material list is empty "}, status=204)

    def post(self, request, material_type=None, assignment_id=None, format=None):
        if assignment_id is None:
            return Response({"message": "Assignment id is required"}, status=400)
        try:
            assignment_obj = Assignment.objects.get(id=int(assignment_id))
            teacher_obj = Teacher.objects.get(user_id=request.user)

            files = request.FILES['file']
            file_name = str(int(time.time()) * 1000)+"_"+files.name
            file_path = 'Material/Assignment/%s/%s/%s' % (
                teacher_obj.user.id, assignment_id, file_name)

            upload_status = upload_assessment_file(files, file_path)
            if upload_status:
                if not AssignmentMaterial.objects.filter(assignment=assignment_obj,
                                                         teacher=teacher_obj,
                                                         material_url=file_path).exists():
                    assignment_material = AssignmentMaterial(
                        assignment=assignment_obj,
                        teacher=teacher_obj,
                        material_url=file_path
                    )
                assignment_material.save()
                return Response({"message": "File Uploaded Successfully", "path": file_path}, status=200)
            else:
                return Response({"message": "Failed to upload"}, status=400)
        except Assignment.DoesNotExist:
            return Response({"status": status.HTTP_404_NOT_FOUND, "message": "Course doesn't exist"}, status=status.HTTP_404_NOT_FOUND)


class StudentAssignmentMaterialList(APIView):
    def get(self, request):
        try:
            module_material = AssignmentMaterial.objects.all()
            files_list_ = []
            for material in module_material:
                url = material.material_url.split('/')
                url.pop()
                course_id = url.pop()
                prefix_path = "/".join(url)+"/"
                files_list = get_assessment_files(prefix_path, course_id)
                files_list_.append(
                    {"assignment_name": material.assignment.title, "file_list": files_list})
            return Response({"message": "success", "data": files_list_}, status=200)
        except Assignment.DoesNotExist:
            return Response({"message": "Assignment Material list is empty "}, status=204)


class StudentAssignmentMatrialFileUpload(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, material_type=None, assignment_id=None, format=None):
        if assignment_id is None:
            return Response({"message": "Assignment id is required"}, status=400)
        try:
            assignment_obj = Assignment.objects.get(id=int(assignment_id))
            student_obj = Student.objects.get(user_id=request.user)

            files = request.FILES['file']
            # file_name = str(int(time.time()) * 1000)+"_"+files.name
            file_name = files.name
            file_path = 'Material/StudentAssignments/%s/%s/%s' % (
                student_obj.id, assignment_id, file_name)

            upload_status = upload_assessment_file(files, file_path)
            if upload_status:

                # assignment_material = StudentAssignmentSubmission(
                #     student = student_obj,
                #     teacher = assignment_obj.teacher,
                #     assignment=assignment_obj,
                #     material_url = file_path,
                #     student_assignment_status=True
                # )
                assignment_material = StudentAssignmentSubmission.objects.get(student=student_obj,
                                                                              teacher=assignment_obj.teacher,
                                                                              assignment=assignment_obj)
                assignment_material.material_url = file_path
                assignment_material.save()
                return Response({"message": "File Uploaded Successfully", "path": file_path}, status=200)
            else:
                return Response({"message": "Failed to upload"}, status=400)
        except Assignment.DoesNotExist:
            return Response({"status": status.HTTP_404_NOT_FOUND, "message": "Course doesn't exist"}, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, assignment_id=None):
        if assignment_id:
            try:
                assignment = Assignment.objects.get(id=assignment_id)
                data = AssignmentMaterial.objects.filter(
                    assignment=assignment).values('material_url')
                materials = [{'url': settings.S3_LINK +
                              url['material_url']} for url in data]
                return Response({"message": "success", "data": materials}, status=200)
            except Assignment.DoesNotExist:
                return Response({"message": "Assignment doesn't exist"}, status=400)
        else:
            return Response({"message": "id not present"}, status=400)


class StudentUploadedAssignmentList(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            files_list_ = []
            if request.user.is_staff:
                assignments = Assignment.objects.all()
            else:
                assignments = Assignment.objects.filter(
                    teacher__user_id=request.user.id)
            for assignment in assignments:
                student_assignment = StudentAssignmentSubmission.objects.filter(
                    assignment=assignment, teacher=assignment.teacher)
                for s_m in student_assignment:
                    url = s_m.material_url.split('/')
                    if len(url) > 1:
                        url.pop()
                        url.pop()

                    prefix_path = "/".join(url)+"/"
                    files_list = get_assessment_files(
                        prefix_path, s_m.assignment.id)
                    files_list_.append({
                        "assignment_id": s_m.id,
                        "assignment_name": s_m.assignment.title,
                        "student_name": s_m.student.user.username, "status": s_m.student_assignment_status,
                        "submitted_time": s_m.submitted_time,
                        "file_list": files_list,
                        "grade": s_m.grade
                    })

            return Response({"message": "succes", "data": files_list_}, status=200)
        except Assignment.DoesNotExist:
            return Response({"message": "Assignment Material list is empty "}, status=204)


class ZoomMeeting(APIView):
    def get(self, request, course_id=None, meeting_id=None):
        if course_id is not None and meeting_id is not None:
            file_download_link = get_video_by_id(meeting_id)
            print(file_download_link)
            if type(file_download_link) == list:
                for index, item in enumerate(file_download_link):
                    file_path = 'Recording/%s/%s_%s.MP4' % (
                        course_id, meeting_id, str(index))
                    response = requests.get(item['stream'], stream=True)
                    temp = tempfile.TemporaryFile()
                    temp.write(response.content)
                    temp.seek(0)
                    upload_status = upload_assessment_file(temp, file_path)
                    file_download_link[index]['uploaded'] = upload_status
                return Response({"message": "Success", "file_download_link": file_download_link}, status=200)
            else:
                return Response({"message": file_download_link}, status=500)
        else:
            # course = StudentCourse.objects.filter(student=request.user.id)
            # files_list = []
            # for index, item in enumerate(course):
            files_list = get_assessment_files(
                'Recording/')
            return Response({"message": "Success", "files_list": files_list}, status=200)


# @api_view(["POST"])
# @renderer_classes((TemplateHTMLRenderer, JSONRenderer))
def store_recording(request):
    if request.method == 'POST':
        # file_download_link = get_meeting_recording(request.data['meeting_id'])
        # module = request.data['module'
        # ]

        files = request.FILES["data"]

        # file_name = datetime.today().strftime('%d_%b_%Y_%H_%M')
        file_name = "balajee_aalok_123"
        # download_recording(file_download_link,
        #                    "./Recordings/{}.MP4".format(file_name))
        upload_status = upload_assessment_file(files,
                                               "./Recordings/{}.MP4".format(file_name))

        if upload_status:
            return Response({"message": "Recording successfully uploaded to aws storage"}, status=200)
        else:
            return Response({"message": "Recording could not be uploaded to aws storage"}, status=400)


@ api_view(['POST',])
def store_recording_video(request):
    files = request.FILES['file']
    file_name = f"./Videos/{files.name}"
    upload_status = upload_to_s3(files, file_name)
    if upload_status:
        return Response({"message": "File successfully saved"}, status=status.HTTP_202_ACCEPTED)
    else:
        return Response({"message": "error"}, status=status.HTTP_400_BAD_REQUEST)


class GenerateVideoUploadLink(APIView):
    def post(self, request):
        try:
            r = generate_upload_link()
            return Response({"message": "Success", "data": r}, status=status.HTTP_200_OK)
        except Exception as e:
            print(e)
            return Response({"message": "Failure"}, status=status.HTTP_404_NOT_FOUND)


class VideoViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = VideoSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['course']
    search_fields = ('=course')

    queryset = Video.objects.all()

    def get_queryset(self):
        student = Student.objects.filter(user=self.request.user.id)
        if not student.exists():
            return Video.objects.filter(user=self.request.user.id)
        return super().get_queryset()

    # def list(self, request, *args, **kwargs):
    #     queryset = Video.objects.filter(user=self.request.user.id)
    #     serializer = VideoSerializer(queryset, many=True)
    #     return Response(serializer.data, status=200)

    # def list(self, request):
    #     try:
    #         student = Student.objects.filter(user=self.request.user.id)
    #         if not student.exists():
    #             videos = Video.objects.filter(
    #                 user=self.request.user.id, course=request.data["course_id"])

    #             # vids = dict()

    #             # for vid in queryset:
    #             #     url = vid.video_link.split('/')
    #             #     url.pop()
    #             #     course_id = url.pop()
    #             #     prefix_path = "/".join(url)+"/"
    #             #     files_list = get_video_files(prefix_path, course_id)

    #             #     if vid.course.id not in vids:
    #             #         vids[vid.course.id] = files_list
    #             #     else:
    #             #         vids[vid.course.id] += files_list

    #             # files_list_ = [{"course_id": key, "file_list": value}
    #             #                for key, value in vids.items()]
    #             # return Response({"message": "success", "data": files_list_}, status=status.HTTP_200_OK)
    #         else:
    #             courses = list(StudentCourse.objects.filter(
    #                 student=student[0]).values_list("course"))
    #             videos = Video.objects.filter(course__in=courses)
    #         serializer = VideoSerializer(videos, many=True)
    #         return Response({"message": "Success", "data": serializer.data}, status=status.HTTP_200_OK)

    #     except Exception as e:
    #         print(e, "eeeee")
    #         return Response({"message": "failed to fetch"}, status=status.HTTP_409_CONFLICT)

    def create(self, request, **kwargs):
        """
        Create a video
        """
        data = dict(request.data)
        data['user'] = request.user.id
        data["course"] = int(data["course"][0])
        data['video_link'] = data["video_link"][0]
        data['name'] = data["video"][0]

        change_video_meta(data['video'][0], data['video_uri'][0])

        ser = VideoSerializer(data=data, context={'request': request})
        if ser.is_valid():
            ser.save()
            return Response({"message": "success", "data": ser.data}, status=200)
        else:
            return Response({"messsage": "error occured", "data": ser.errors}, status=405)

        # upload_status = False
        # # upload_status = upload_to_s3(files, file_path)
        # if upload_status:
        #     request.data['video_link'] = file_path
        #     request.data['course'] = course_id
        #     serializer = VideoSerializer(
        #         data=request.data, context={'request': request})

        #     if serializer.is_valid():
        #         serializer.save()
        #         return Response(serializer.data, status=status.HTTP_201_CREATED)
        #     print(serializer.errors)
        #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # else:
        #     return Response({"message": "Not uploaded"}, status=status.HTTP_400_BAD_REQUEST)

# def store_recording(request):
#     if request.method == 'POST':
#         file_download_link = get_meeting_recording(request.data['meeting_id'])
#         module = request.data['module']

#         file_name = datetime.today().strftime('%d_%b_%Y_%H_%M')
#         download_recording(file_download_link,
#                            "./Recordings/{}.MP4".format(file_name))
#         upload_status = upload_file_to_storage(
#             "./Recordings/{}.MP4".format(file_name), folder_name=module)
#         if upload_status:
#             return Response({"message": "Recording successfully uploaded to aws storage"}, status=200)
#         else:
#             return Response({"message": "Recording could not be uploaded to aws storage"}, status=400)


def fetch_recording(request):
    if request.method == 'GET':
        module = request.data['module']
        list_of_files = list_files_from_storage(dir_name=module)
        return Response(list_of_files, status=200)


def play_recording(request):
    if request.method == "POST":
        module = request.data['module']
        file_name = request.data['file_name']
        download_files_from_aws([os.path.join(module, file_name)])
        return Response(os.path.join(os.getcwd(), module, file_name), status=200)


class GenericFileOperation(APIView):
    def get(self, request, material_type=None, course_id=None, format=None):
        key = request.GET.get('key')
        download = request.GET.get('download')
        # if material_type is None:
        #     return Response({"message": "Material Type Required"}, status=400)

        if key is not None:
            s3_obj = download_assessment_file(key)
            splited_path = key.split("/")
            file_name = splited_path[len(splited_path)-1]
            contents = s3_obj['Body'].read()
            temp = tempfile.TemporaryFile()
            temp.write(contents)
            temp.seek(0)
            mime_type, _ = mimetypes.guess_type(key)
            response = HttpResponse(temp, content_type=mime_type)
            if download is not None:
                response['Content-Disposition'] = "attachment; filename=%s" % (
                    file_name)
            response['X-Frame-Options'] = "*"
            # print("download",download)
            #
            return response


class AssignGrade(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, submitted_assigment_id=None):
        if submitted_assigment_id is None:
            return Response({"message": "ID is missing"}, status=400)
        else:
            try:
                submited_assignemnt = StudentAssignmentSubmission.objects.get(
                    pk=submitted_assigment_id)
                submited_assignemnt.grade = str(request.data['grade'])
                submited_assignemnt.save()
                return Response({"message": "Grade Updated"}, status=200)
            except StudentAssignmentSubmission.DoesNotExist:
                return Response({"message": "Invalid ID"}, status=400)


class SubmitStudentQuiz(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        score = 0
        student_obj = Student.objects.get(user_id=request.user.id)
        quiz_data = {
            "quiz": request.data['quiz'],
            "teacher": request.data['teacher'],
            "student": student_obj.pk,
            "score": score
        }
        try:
            quiz_submitted = StudentQuizDetails.objects.filter(
                quiz=request.data['quiz'], teacher=request.data['teacher'], student=student_obj.pk,)
            if len(quiz_submitted) <= 0:
                quizzes = QuizQuestions.objects.filter(
                    quiz_id=request.data['quiz'])
                quiz_serializer = StudentQuizDetailsSerializer(data=quiz_data)
                if quiz_serializer.is_valid():
                    ans_list = []
                    for ans in request.data['answer']:
                        quiz = [x for x in quizzes if x.id == ans['question']]
                        if len(quiz) > 0:
                            if ans['answer'] == quiz[0].right_ans:
                                ans['result'] = True
                                score += 1
                            else:
                                ans['result'] = False
                            ans_list.append(ans)
                        else:
                            return Response({"message": "Invalid Quiestion"}, status=400)
                    quiz_data['score'] = score
                    quiz_serializer = StudentQuizDetailsSerializer(
                        data=quiz_data)
                    if quiz_serializer.is_valid():
                        quiz_serializer.save()
                        for index, anx in enumerate(ans_list):
                            print(quiz_serializer.data)
                            ans_list[index]['submitted_quiz'] = quiz_serializer.data['id']
                        quiz_answer_serializer = StudentQuizAnswerSerializer(
                            data=ans_list, many=True)
                        if quiz_answer_serializer.is_valid():
                            quiz_answer_serializer.save()
                else:
                    return Response({"message": quiz_serializer.errors}, status=400)
                return Response({"message": "Quiz Submitted"}, status=200)
            else:
                return Response({"message": "Quiz Already Submitted"}, status=200)

        except QuizQuestions.DoesNotExist:
            return Response({"message": "Invalid Quiz"}, status=400)


class GetTeacher(APIView):
    def get(self, request):
        teacher = Teacher.objects.all()
        serialzer = GetTeacherSerializer(teacher, many=True)
        return Response({"message": "Success", "data": serialzer.data}, status=200)


class CourseEnquire(APIView):
    def post(self, request):
        enquire_email = ["anubrata@sambodhi.co.in", "trainings@sambodhi.co.in"]
        data = request.data

        mail = html_send_mail(body=data, subject="Enquire",
                              sender_mail_id=enquire_email)

        return Response({"message": "Success"}, status=200)


class MeetingAttendance(APIView):
    def get(self, request, meeting_id):
        meeting_id = meeting_id.strip()
        res = get_meeting_attendance(meeting_id)
        return Response({"message": "Success", "res": res}, status=200)
# if assignment_id:
#             try:
#                 assignment = Assignment.objects.get(id=assignment_id)
#                 data = AssignmentMaterial.objects.filter(assignment=assignment).values('material_url')
#                 materials = [ {'url':settings.S3_LINK + url['material_url']} for url in data]
#                 return Response({"message": "success", "data": materials}, status=200)
#             except Assignment.DoesNotExist:
#                 return Response({"message":"Assignment doesn't exist"},status=400)
#         else:
#             return Response({"message": "id not present"}, status=400)

# token_ = request_token
#         base_url = "https://api.zoom.us/v2"
#         meeting_id = self.get_meeting_id(request)
#         url = base_url + "/meetings/" + str(meeting_id) + "/recordings"
#         response = requests.get(url, headers={'Authorization': 'Bearer ' + token_})
#         if response.status == 200:
#             response = response.json()
#             recording_count = response['recording_count']
#             recording_files = response['recording_files']


#             return Response({"m":response},status=200)


# class AddAssignmentQuestions(APIView):
#     permission_classes = [IsAuthenticated]
#     serializer_class = AssignmentQuestionsSerializer
#     def post(self, request):
#         serializer = self.serializer_class(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response({"message":"assignment questions is created"},status=200)
#         else:
#             return Response({"message":serializer.errors},status=400)


class FeedbackViewSet (ModelViewSet):
    """
    API endpoint that lets you create, and retrieve feedback.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FeedbackSerializer

    def get_queryset(self):
        """
        Return a list of coupon.
        """

        qs_all = Feedback.objects.all()

        for object in qs_all:
            object.save()

        if self.request.user.is_staff:
            return qs_all

        return qs_all

    def create(self, request, **kwargs):
        """
        Create a feedback
        """
        request.data["user"] = self.request.user.id
        serializer = FeedbackSerializer(
            data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetStudentAttendance(APIView):
    def get(self, request, course_id):
        student_course = StudentCourse.objects.filter(
            course_id=course_id).order_by("id")
        if student_course.exists():
            serializer = StudentCourseSerializer(student_course, many=True)
            return Response({"message": "Success", "data": serializer.data}, status=200)
        else:
            return Response({"message": "No student enrolled"}, status=status.HTTP_404_NOT_FOUND)


class StudentCourseUpdate(APIView):
    def put(self, request, course_id):
        if course_id is None:
            return Response({"message": "ID Required"}, status=400)
        else:
            try:
                student_course = StudentCourse.objects.get(
                    id=request.data['id'])
                request.data['student'] = student_course.student.id
                serializer = StudentCourseSerializer(
                    student_course, data=request.data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response({"message": "Status Updated", "data": serializer.data}, status=200)
                else:
                    return Response({"message": "Problem", "data": serializer.data}, status=400)
            except StudentCourse.DoesNotExist:
                return Response({"message": "Invalid course"}, status=400)


class TakeAllStudentsAttendance(APIView):
    def post(self, request, course_id):
        if course_id is None:
            return Response({"message": "ID Required"}, status=400)
        else:
            try:
                student_course = StudentCourse.objects.filter(
                    course_id=course_id)
                for entry in student_course:
                    entry.attendance.append({request.data['date']: True})
                    entry.save()
                student_course = StudentCourse.objects.filter(
                    course_id=course_id)
                serializer = StudentCourseSerializer(student_course, many=True)
                return Response({"message": "Status Updated", "data": serializer.data}, status=200)
            except StudentCourse.DoesNotExist:
                return Response({"message": "Invalid course"}, status=400)


class DeleteModuleMaterial(APIView):
    def delete(self, request: HttpRequest):
        material_url = request.GET["material_url"]

        try:
            moduleMat = ModuleMaterial.objects.get(material_url=material_url)
            r = delete_assessment_file(moduleMat.material_url)
            print(r)
            if r is not False:
                moduleMat.delete()
                return Response(data="Deleted Successfully", status=status.HTTP_200_OK)
            else:
                return Response(data="Not deleted", status=status.HTTP_400_BAD_REQUEST)

        except ModuleMaterial.DoesNotExist:
            return Response(data="Not found", status=status.HTTP_400_BAD_REQUEST)


class StudentEmiOption(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, student_id):
        student = Student.objects.filter(id=student_id)
        if student.exists():
            serializer = StudentSerializer(
                student[0], data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "Status Updated", "data": serializer.data}, status=status.HTTP_200_OK)
            else:
                return Response({"message": "Problem", "data": serializer.data}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"message": f"No student with given id = {student_id}"}, status=status.HTTP_404_NOT_FOUND)


class CheckIfExists(APIView):
    def get(self, request, username):
        try:
            student = Student.objects.filter(user__username=username)
            if student.exists():
                if StudentCourse.objects.filter(student=student[0]).exists():
                    return Response({"message": "Student is enrolled"}, status=status.HTTP_200_OK)
                else:
                    return Response({"message": "Student is not enrolled"}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({"message": "No such Student exits"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(e)
