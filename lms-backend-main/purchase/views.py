import json
import time
import uuid

from core_app.aws_interface import get_assessment_files, upload_assessment_file
from core_app.models import StudentCourse
from core_app.serializers import StudentCourseSerializer
# Create your views here.
from django.conf import settings
from django.shortcuts import render
from LMS.encode import decrypt_text, encrypt_text
from products.models import CourseDetails
from products.serializers import *
from purchase.ccavenue import cc_avenue_decrypt, cc_avenue_encrypt
from purchase.models import Cart, OrderItem, TransactionInfo
from purchase.serializers import (CartCreate, CartGet, OrderItems,
                                  TransactionCreate)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

cc_avenue_redirect_url = settings.CC_AVENUE_REDIRECT_URL
cc_avenue_cancel_url = settings.CC_AVENUE_CANCEL_URL
cc_avenue_access_code = settings.CC_AVENUE_ACCESS_CODE


class WordpressCart(APIView):
    def post(self, request):
        try:
            def save_product(user, data):
                # request.data._mutable = True
                if CourseDetails.objects.filter(is_deleted=False, mysql_id=data['mysql_id']).exists():
                    return CourseDetails.objects.get(is_deleted=False, mysql_id=data['mysql_id'])
                data_pass = {}
                data_pass["title"] = data["title"]
                data_pass["batch_name"] = "Xander Clemons"
                data_pass["image_1"] = "Assets/Assignment/1680805436000_fireworks_3_1_by_meihua_stock_d4tja0h.jpg"
                data_pass["imageFile"] = {}
                data_pass["curriculumFile"] = {}
                data_pass["curriculumLink"] = ""
                data_pass["para_1"] = "Sed esse corporis fu"
                data_pass["para_2"] = "Aliquid totam aliqui"
                data_pass["para_3"] = "Aut quasi magna quia"
                data_pass["target_audience"] = "Ipsum pariatur Face"
                data_pass["time_commitment"] = "Fugiat officia temp"
                data_pass["instructor_name"] = ""
                data_pass["teacher"] = "3"
                data_pass["instructor_designation"] = "Yuli Buckley"
                data_pass["instructorImage"] = {}
                data_pass["instructor_image"] = "Assets/Assignment/1680805436000_fireworks_3_1_by_meihua_stock_d4tja0h.jpg"
                data_pass["course_level"] = "Expert"
                data_pass["video_thumb"] = ""
                data_pass["duration"] = "Eos est ut ducimus"
                data_pass["lectures"] = "35"
                data_pass["subject"] = "Rerum voluptatibus a"
                data_pass["price"] = data["price"]
                data_pass["language"] = "Voluptatem quos hic"
                data_pass["batch"] = {
                    "name": "Xander Clemons",
                    "slots": [
                        {
                            "id": "c8016c66-3f56-4bd4-aeb4-a3bc78002218",
                            "startDate": "1999-09-19",
                            "frequency": "Ut placeat et autem",
                            "Timing1": "13:18",
                            "Timing2": "10:51",
                            "soldout": "No",
                            "weekendbatch": "Yes"
                        }
                    ]
                }
                data_pass["module"] = [
                    {
                        "id": "f7deb3a8-9077-46e0-8c0c-89dc63af503c",
                        "title": "Voluptate beatae ass",
                        "points": [
                            "Itaque velit quibus",
                            "Et fugit quasi prae",
                            "Incididunt voluptas ",
                            "Eveniet iusto nesci",
                            "Exercitation laborum",
                            "Cupiditate repellend"
                        ]
                    }]
                data_pass["meeting_link"] = "https://www.google.com/"
                data_pass["meeting_pwd"] = "123456789"
                data_pass["twitter"] = "Rerum nesciunt iure"
                data_pass["facebook"] = "Nihil incidunt impe"
                data_pass["instagram"] = "Facere laboris non v"
                data_pass["pinterst"] = "Illum voluptatem au"
                data_pass["category"] = "7"
                data_pass["curriculum_link"] = "Assets/Assignment/1680805436000_fireworks_3_1_by_meihua_stock_d4tja0h.jpg"
                data_pass['user'] = user.id
                data_pass['created_by'] = user.id
                data_pass['updated_by'] = user.id
                data_pass['description'] = "None"
                data_pass["mysql_id"] = data["mysql_id"]
                print(data_pass)
                try:
                    course_serialzer = CourseSerializerList(
                        data=data_pass)
                    if course_serialzer.is_valid():
                        course = course_serialzer.save()
                        data_pass['course'] = course.id
                        pricing_serializer = CoursePricingGet(
                            data=data_pass)
                        if pricing_serializer.is_valid():
                            pricing_data = pricing_serializer.save()
                            data_pass['price'] = pricing_data.id
                            course_details_serializer = CourseDetailsCreate(
                                data=data_pass)
                            if course_details_serializer.is_valid():
                                product = course_details_serializer.save()
                                return product
                            else:
                                print(course_details_serializer.errors,
                                      "Course Details")
                                return False
                        else:
                            print(pricing_serializer.errors,
                                  "Pricing Serializer")
                            return False
                    else:
                        print(course_serialzer.errors, "Course Serial")
                        return False
                except Exception as e:
                    print(e, "SSSSSSSSS")
                    return False

            pd = save_product(request.user, request.data)
            if pd == False:
                return Response({"message": "Product not added to cart, A problem occured"}, status=404)
            else:
                if Cart.objects.filter(user=request.user.id, product_id=pd.id).exists():
                    return Response({"message": "Selected product already exist in cart"}, status=409)
                serializer = CartCreate(
                    data={"product": pd.id, "user": request.user.id})
                if serializer.is_valid():
                    serializer.save()
                    return Response({"message": "Cart Updated", "data": serializer.data}, status=200)
                else:
                    return Response({"message": "Invalid Data", "data": serializer.errors}, status=400)
        except Exception as ex:
            print(ex, "AAASSSSSSA")


class CartOperations(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.data['user'] = request.user.id
        print(request.data['product'])
        if Cart.objects.filter(user=request.user.id, product_id=request.data['product']).exists():
            return Response({"message": "Selected product already exist in cart"}, status=409)

        serializer = CartCreate(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Cart Updated", "data": serializer.data}, status=200)
        else:
            return Response({"message": "Invalid Data", "data": serializer.errors}, status=400)

    def get(self, request):
        cart = Cart.objects.filter(user=request.user.id)
        serializer = CartGet(cart, many=True)
        return Response({"message": "Success", "data": serializer.data}, status=200)

    def delete(self, request, cart_id=None):
        cart = Cart.objects.get(id=cart_id)
        serializer = CartGet(cart)
        cart.delete()
        return Response({"message": "Cart Deleted", "data": serializer.data}, status=200)


class GetPaymentUrl(APIView):
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        plainText = ''
        for j in data:
            plainText += "%s=%s&" % (j, data[j])
        encrypted_data = cc_avenue_encrypt(plainText)
        payment_url = 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction&encRequest=%s&access_code=%s' % (
            encrypted_data, settings.CC_AVENUE_ACCESS_CODE)
        return Response({"message": "no content", "payment_url": payment_url}, status=200)


class DoCheckout(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.data['user'] = request.user.id
        transaction_id = uuid.uuid4()
        request.data['id'] = transaction_id
        transaction_info_serializer = TransactionCreate(data=request.data)
        if transaction_info_serializer.is_valid():
            data = request.data
            data['transaction_id'] = transaction_id
            cc_data = build_cc_avenue_params(data)
            plainText = ''
            for j in cc_data:
                plainText += "%s=%s&" % (j, cc_data[j])
            plainText += "cancel_url=%s&" % (cc_avenue_cancel_url+"?app_code="+encrypt_text(
                json.dumps({"transaction_id": str(transaction_id), "success": False})))
            plainText += "redirect_url=%s&" % (cc_avenue_redirect_url+"?app_code="+encrypt_text(
                json.dumps({"transaction_id": str(transaction_id), "success": True})))
            encrypted_data = cc_avenue_encrypt(plainText)

            payment_url = 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction&encRequest=%s&access_code=%s' % (
                encrypted_data, settings.CC_AVENUE_ACCESS_CODE)
            data['request'] = encrypted_data
            transaction_info_serializer = TransactionCreate(data=data)
            if transaction_info_serializer.is_valid():
                transaction_info_serializer.save()
                order_items = []
                for p in data['cart']:
                    order_items.append(
                        {"user": request.user.id, "order_id": transaction_id, "product_id": p['product']['course']['id']})
                order_items_serializer = OrderItems(
                    data=order_items, many=True)
                if order_items_serializer.is_valid():

                    order_items_serializer.save()
                    return Response({"message": "Success", "payment_url": payment_url}, status=200)
                else:
                    return Response({"message": "Invalid Data1", "error": order_items_serializer.errors}, status=400)
        else:
            return Response({"message": "Invalid Data2", "error": transaction_info_serializer.errors}, status=400)


class ValidatingTransaction(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.data['user'] = request.user.id
        decrypted_data = decrypt_text(request.data['app_code'])
        data = json.loads(decrypted_data)
        if data['success']:
            TransactionInfo.objects.filter(
                id=data['transaction_id']).update(status="Success")
            OrderItem.objects.filter(
                order_id=data['transaction_id']).update(status="Success")
            orders = OrderItem.objects.filter(
                order_id=data['transaction_id']).values()
            student_course = list()
            for order in orders:
                student_course.append(
                    {"course": order['product_id_id'], "student": order['user_id']})

            student_course = StudentCourseSerializer(
                data=student_course, many=True)
            if student_course.is_valid():
                student_course.save()
                Cart.objects.filter(user=request.user.id).delete()
            else:
                return Response({"message": "Failed while mapping to student", "success": False, "error": student_course.errors}, status=200)
            return Response({"message": "Payment Success", "success": True}, status=200)
        else:
            TransactionInfo.objects.filter(
                id=data['transaction_id']).update(status="Failed")
            OrderItem.objects.filter(
                order_id=data['transaction_id']).update(status="Failed")
            return Response({"message": "Payment Failed", "success": False}, status=200)


def build_cc_avenue_params(data):
    cc_data = {}
    cc_data['currency'] = 'INR'
    cc_data['amount'] = int(data['final_amount'])
    cc_data['billing_name'] = ("%s %s" % (
        data['first_name'], data['last_name']))
    cc_data['billing_address'] = (
        "%s , %s" % (data['street'], data['address']))
    cc_data['billing_city'] = ("%s" % (data['city']))
    cc_data['billing_state'] = ("%s" % (data['state']))
    cc_data['billing_zip'] = ("%s" % (data['zipcode']))
    cc_data['billing_country'] = ("%s" % (data['country']))
    cc_data['billing_tel'] = ("%s" % (data['phone_number']))
    cc_data['billing_email'] = ("%s" % (data['email']))
    cc_data['billing_notes'] = ("%s" % (data['note']))
    cc_data['order_id'] = data['transaction_id']
    return cc_data
