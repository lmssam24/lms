from core_app.views import *
from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt
from rest_framework import routers

router = routers.DefaultRouter(trailing_slash=False)
router.register(r'video', VideoViewSet, basename='video')
router.register(r'module', ModuleViewSet, basename="module")
router.register(r'feedback', FeedbackViewSet, basename="feedback")

urlpatterns = [
    path('login', signin.as_view(), name='login'),
    path('register', RegisterUser.as_view(), name='register'),
    path('add_quiz', AddQuiz.as_view(), name='add_quiz'),
    path('add_quiz/<int:quiz_id>', AddQuiz.as_view(), name='update_quiz'),
    path('add_module_quiz', AddModuleQuiz.as_view(), name='add_module_quiz'),
    path('add_module_quiz/<int:quiz_id>',
         AddModuleQuiz.as_view(), name='update_module_quiz'),
    path('add_quiz_question', AddQuizQuestions.as_view(), name='add_quiz_question'),
    path('add_quiz_question/<int:quiz_question_id>',
         AddQuizQuestions.as_view(), name='update_quiz_question'),
    path('course_category', AddCourseCategory.as_view(),
         name='add_quiz_course_category'),
    path('add_course', AddCourse.as_view(), name='add_course'),
    path('add_course/<int:course_id>', AddCourse.as_view(),
         name='update_course'),  # Edit course
    path('add_course_quiz', AddCourseQuiz.as_view(), name='add_course'),
    path('add_assignment', AddAssignment.as_view(), name='add_assignment'),
    path('add_assignment/<int:assignment_id>',
         AddAssignment.as_view(), name='update_assignment'),
    # path('add_assignment_question',AddAssignmentQuestions.as_view(), name='add_assignment_question'),
    path('create_meeting', CreateMeeting.as_view()),
    path('student_meeting', StudentMeetingList.as_view()),
    path('user_profile', UserProfile.as_view()),
    path('submit_assignment', StudentSubmitAssignment.as_view()),
    path('view_assignment', StudentViewAssignments.as_view()),
    path('get_recording_student', get_recording_student.as_view()),
    path('enroll_student', EnrollStudent.as_view()),
    path('student_list', StudentList.as_view()),
    path('student_list/<str:username>', StudentList.as_view()),
    path('student_quiz_list', StudentQuizList.as_view()),
    path('student_quiz_question_list', StudentQuizQuestions.as_view()),
    path('student_quiz_submission', StudentQuizSubmission.as_view()),
    path('student_assignment_list', StudendAssignmentList.as_view()),
    path('student_emi_option/<str:student_id>', StudentEmiOption.as_view()),
    path('', include('authentication.urls')),

    path("upload_course_material/<str:course_id>",
         CourseMatrialFileUpload.as_view(), name="course_get_by_id"),
    path("get_course_material/<str:course_id>",
         CourseMatrialFileUpload.as_view(), name="course_get_by_id"),
    path("student_assignment_material_list",
         StudentAssignmentMaterialList.as_view(), name="assignment_material_list"),
    path("student_course_material_list",
         StudentCourseMaterialList.as_view(), name="assignment_course_list"),

    path("upload_module_material/<str:module_id>",
         ModuleMatrialFileUpload.as_view(), name="module_post_by_id"),
    path("delete_module_material",
         DeleteModuleMaterial.as_view(), name="module_material_del_by_id"),
    path("get_module_material/<str:module_id>",
         ModuleMatrialFileUpload.as_view(), name="module_get_by_id"),
    path("student_module_material_list",
         StudentModuleMaterialList.as_view(), name="student_module_list"),

    path("upload_assignment_material/<str:assignment_id>",
         AssignmentMatrialFileUpload.as_view(), name="assignment_get_by_id"),
    path("get_assignment_material/<str:course_id>",
         AssignmentMatrialFileUpload.as_view(), name="course_get_by_id"),

    path("upload_student_assignment_material/<str:assignment_id>",
         StudentAssignmentMatrialFileUpload.as_view(), name="assignment_get_by_id"),
    path("uploaded_student_assignment_material_list/",
         StudentUploadedAssignmentList.as_view(), name="uploaded_assigment_material_list"),

    path("zoom", ZoomMeeting.as_view(), name="zoom_meeting_get_by_id"),
    path("zoom/<str:course_id>", ZoomMeeting.as_view(),
         name="zoom_meeting_get_by_id"),
    path("zoom/<str:course_id>/<str:meeting_id>",
         ZoomMeeting.as_view(), name="zoom_meeting_get_by_id"),

    path('store_recording123/', csrf_exempt(store_recording), name="store_recording"),
    path('store_recording_video', store_recording_video,
         name="store_recording_video"),
    path('fetch_recording/', fetch_recording, name="fetch_recording"),
    path("play_recording", play_recording, name="play_recording"),

    path("material", GenericFileOperation.as_view(), name="assessment_get"),
    # path('register/',RegisterUser.as_view(), name='register'),

    path('submit_quiz', SubmitStudentQuiz.as_view()),
    path('add_grade/<int:submitted_assigment_id>', AssignGrade.as_view()),
    path('teacher', GetTeacher.as_view()),
    path('enquire', CourseEnquire.as_view()),
    path('get_attendance/<str:course_id>/', GetStudentAttendance.as_view()),
    path('update_attendance/<str:course_id>/', StudentCourseUpdate.as_view()),
    path('add_attendance/<str:course_id>/',
         TakeAllStudentsAttendance.as_view()),

    path('generate_video_upload', GenerateVideoUploadLink.as_view()),
    path("check_if_enrolled/<str:username>/", CheckIfExists.as_view()),
    path('', include(router.urls)),
]
