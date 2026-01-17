# accounts/urls.py
from django.urls import path
from .views import (
    AdminSupportTicketListView,
    MySupportTicketsView,
    RegisterView,
    LoginView,
    GoogleLoginView,
    ProfileView,
    CertificationCreateView,
    CertificationDetailView,
    PredictionHistoryListCreateView,
    PredictionHistoryDetailView,
    SupportTicketDeleteView,
    TestEncryptionView,
    JobPredictionView,
    AdminAnalyticsView,
    AdminUserListView,
    AdminUpdateUserRoleView,
    AdminDeleteUserView,
    AdminModelStatusView,
    AdminRetrainModelView,
    AdminPredictionLogsView,
    PredictionFeedbackCreateView,
    AdminPredictionFeedbackView,
    AdminLogsView,
    AdminFlagUserView,
    SupportTicketCreateView,
    AdminSupportStatusView,
    AdminSupportReplyView,
    FlagUserView,
    UnflagUserView,
    MakeMeAdminView,
)

urlpatterns = [
    # AUTH
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/google/", GoogleLoginView.as_view(), name="google-login"),

    # PROFILE (education + certifications + resume)
    path("profile/", ProfileView.as_view(), name="profile"),
    path(
        "profile/certifications/",
        CertificationCreateView.as_view(),
        name="certification-create",
    ),
    path(
        "profile/certifications/<int:pk>/",
        CertificationDetailView.as_view(),
        name="certification-detail",
    ),

    # PREDICTION HISTORY
    path(
        "predictions/history/",
        PredictionHistoryListCreateView.as_view(),
        name="prediction-history",
    ),
    path(
        "predictions/history/<int:pk>/",
        PredictionHistoryDetailView.as_view(),
        name="prediction-history-detail",
    ),
    path(
    "predictions/predict/",
    JobPredictionView.as_view(),
    name="prediction-ml",
    ),
    # TEST ENCRYPTION
    path("test-encryption/", TestEncryptionView.as_view(), name="test-encryption"),
    # ADMIN
    path("admin/analytics/", AdminAnalyticsView.as_view()),
    path("admin/users/", AdminUserListView.as_view()),
    path("admin/users/<int:user_id>/role/", AdminUpdateUserRoleView.as_view()),
    path("admin/users/<int:user_id>/", AdminDeleteUserView.as_view()),
    path("admin/model/status/", AdminModelStatusView.as_view()),
    path("admin/model/retrain/", AdminRetrainModelView.as_view()),
    path("admin/predictions/", AdminPredictionLogsView.as_view()),
    path(
    "predictions/feedback/",
    PredictionFeedbackCreateView.as_view(),
    name="prediction-feedback",
),

path(
    "admin/feedback/",
    AdminPredictionFeedbackView.as_view(),
    name="admin-feedback",
),
path("admin/logs/", AdminLogsView.as_view()),
path(
    "admin/users/<int:user_id>/flag/",
    AdminFlagUserView.as_view(),
),
path("admin/users/<int:user_id>/role/", AdminUpdateUserRoleView.as_view()),
path("admin/model/retrain/", AdminRetrainModelView.as_view()),
path("support/tickets/", SupportTicketCreateView.as_view()),
path("admin/support/status/", AdminSupportStatusView.as_view()),
path("admin/support/<int:pk>/reply/", AdminSupportReplyView.as_view()),
path("admin/support/", AdminSupportTicketListView.as_view()),
path("support/my-tickets/", MySupportTicketsView.as_view()),
path("support/tickets/<int:pk>/delete/", SupportTicketDeleteView.as_view()),
path("admin/users/<int:user_id>/flag/", FlagUserView.as_view()),
path("admin/users/<int:user_id>/unflag/", UnflagUserView.as_view()),

]