import time

from core_app.aws_interface import get_assessment_files, upload_assessment_file
from core_app.models import Student, StudentCourse
from core_app.serializers import CourseSerializerList
from django.shortcuts import render
from LMS import settings
from products.models import CourseDetails
from products.serializers import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

# Create your views here.


class GetCourseDetails(APIView):
    def get(self, request, category_id=None):
        course_id = None
        if 'course_id' in request.GET:
            course_id = request.GET['course_id']
            print(course_id)
        if course_id:
            try:
                course_detail = CourseDetails.objects.filter(
                    course=course_id, is_deleted=False, mysql_id__isnull=True)
                serializer = CourseDetailsGet(course_detail, many=True)
                return Response({"message": "Success", "data": serializer.data}, status=200)
            except CourseDetails.DoesNotExist:
                return Response({"message": "Invalid category"}, status=400)
        elif category_id is None:
            if self.request.user.is_superuser:
                course_details = CourseDetails.objects.filter(
                    is_deleted=False)
            else:
                course_details = CourseDetails.objects.filter(
                    is_deleted=False, mysql_id__isnull=True)
            serializer = CourseDetailsGet(course_details, many=True)

            return Response({"message": "Success", "data": serializer.data}, status=200)
        else:
            try:
                course_detail = CourseDetails.objects.filter(
                    category=category_id, is_deleted=False, mysql_id__isnull=True)
                serializer = CourseDetailsGet(
                    course_detail, many=True)
                return Response({"message": "Success", "data": serializer.data}, status=200)
            except CourseDetails.DoesNotExist:
                return Response({"message": "Invalid category"}, status=400)


class GetStudentCourseDetails(APIView):
    def get(self, request, category_id=None):
        courses = Course.objects.all()
        if request.user.is_authenticated:
            if Student.objects.filter(user=request.user).exists():
                courses = Course.objects.filter(is_deleted=False, id__in=list(
                    StudentCourse.objects.filter(student__user=request.user).values_list('course', flat=True)))
        if category_id is None:
            course_details = CourseDetails.objects.filter(
                is_deleted=False, course__in=courses)
            serializer = CourseDetailsGet(course_details, many=True)
            return Response({"message": "Success", "data": serializer.data}, status=200)
        else:
            try:
                course_detail = CourseDetails.objects.filter(
                    category=category_id, is_deleted=False).filter(course__in=courses)
                serializer = CourseDetailsGet(course_detail, many=True)
                return Response({"message": "Success", "data": serializer.data}, status=200)
            except CourseDetails.DoesNotExist:
                return Response({"message": "Invalid category"}, status=400)


def isfloat(num):
    try:
        float(num)
        return True
    except ValueError:
        return False


class AddCourseDetails(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.data['created_by'] = request.user.id
        request.data['updated_by'] = request.user.id
        request.data['description'] = "None"
        try:
            course_serialzer = CourseSerializerList(data=request.data)
            if course_serialzer.is_valid():
                course = course_serialzer.save()
                request.data['course'] = course.id
                pricing_serializer = CoursePricingGet(data=request.data)
                if pricing_serializer.is_valid():
                    pricing_data = pricing_serializer.save()
                    request.data['price'] = pricing_data.id
                    course_details_serializer = CourseDetailsCreate(
                        data=request.data)
                    if course_details_serializer.is_valid():
                        course_details_serializer.save()
                        return Response({"message": "course Detail is created", "data": course_details_serializer.data}, status=200)
                    else:
                        return Response({"message": "Invalid Data", "errors": course_details_serializer.errors}, status=400)
                else:
                    return Response({"message": "Invalid Data", "errors": pricing_serializer.errors}, status=400)
            else:
                return Response({"message": "Invalid Data", "errors": course_serialzer.errors}, status=400)
        except Exception as e:
            print(e)

    def put(self, request, category_id=None):
        request.data['updated_by'] = request.user.id
        if category_id is None:
            return Response({"message": "ID Required"}, status=400)
        try:
            course_detail = CourseDetails.objects.get(
                id=category_id, is_deleted=False)
            course = Course.objects.get(id=course_detail.course_id)
            course_serialzer = CourseSerializerList(
                course, data=request.data, partial=True)
            if course_serialzer.is_valid():
                course_serialzer.save()
                price = CoursePrice.objects.get(
                    id=request.data['price']['id'], is_deleted=False)
                price_serializer = CoursePricingGet(
                    price, data=request.data['price'], partial=True)
                if price_serializer.is_valid():
                    pricing_data = price_serializer.save()
                    request.data['price'] = pricing_data.id
                    course_details_serializer = CourseDetailsCreate(
                        course_detail, data=request.data, partial=True)
                    if course_details_serializer.is_valid():
                        course_details_serializer.save()
                        return Response({"message": "Course Detail Updated", "data": course_details_serializer.data}, status=200)
                    else:
                        return Response({"message": "Invalid Data", "errors": course_details_serializer.errors}, status=400)
                else:
                    return Response({"message": "Invalid Pricing Data", "errors": price_serializer.errors}, status=400)

            else:
                return Response({"message": "Invalid Data", "errors": course_serialzer.errors}, status=400)

        except CourseDetails.DoesNotExist as e:
            return Response({"message": "No data with the id mentioned"}, status=500)

    def delete(self, request, category_id=None):
        request.data['updated_by'] = request.user.id
        if category_id is None:
            return Response({"message": "ID Required"}, status=400)
        try:
            course_detail = CourseDetails.objects.get(
                id=category_id, is_deleted=False)
            course = Course.objects.get(id=course_detail.course_id)
            course_serialzer = CourseSerializerList(
                course, data={"is_deleted": True}, partial=True)
            if course_serialzer.is_valid():
                course_serialzer.save()
                course_details_serializer = CourseDetailsCreate(
                    course_detail, data={"is_deleted": True}, partial=True)
                if course_details_serializer.is_valid():
                    course_details_serializer.save()
                    return Response({"message": "Course Detail Updated", "data": course_details_serializer.data}, status=200)
                else:
                    return Response({"message": "Invalid Data", "errors": course_details_serializer.errors}, status=400)
            else:
                return Response({"message": "Invalid Data", "errors": course_serialzer.errors}, status=400)
        except CourseDetails.DoesNotExist as e:
            return Response({"message": "No data with the id mentioned"}, status=500)


class AssetsOperation(APIView):
    def get(self, request):
        files_list = get_assessment_files('Assets/')
        return Response({"message": "Invalid category", "files_list": files_list}, status=200)

    def post(self, request):
        files = request.FILES['file']
        file_name = str(int(time.time()) * 1000)+"_"+files.name
        file_path = 'Assets/Assignment/%s' % (file_name)
        upload_status = upload_assessment_file(files, file_path)
        if upload_status:
            return Response({"message": "Uploaded Successfully", "key": ("Dev/" if settings.ENV == "Dev" else "") + file_path}, status=200)


class CourseDetailStatusUpdate(APIView):
    def post(self, request, category_id=None):
        if category_id is None:
            return Response({"message": "ID Required"}, status=400)
        else:
            try:
                course_detail = CourseDetails.objects.get(
                    id=category_id, is_deleted=False)
                serializer = CourseDetailsCreate(
                    course_detail, data=request.data, partial=True)
                return Response({"message": "Status Updated", "data": serializer.data}, status=200)
            except CourseDetails.DoesNotExist:
                return Response({"message": "Invalid category"}, status=400)
