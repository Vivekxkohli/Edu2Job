# accounts/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import IsAdminUser
from django.db.models import Count
from .models import User, Education, Certification, PredictionHistory, AdminLog, PredictionFeedback, SupportTicket
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    EducationSerializer,
    CertificationSerializer,
    PredictionHistorySerializer,
    PredictionFeedbackSerializer,
    SupportTicketSerializer,
)
from accounts.services.ml_predictor import predict_jobs
import requests
from .services.ml_predictor import retrain_model_from_csv
from django.utils import timezone
from django.db.models import Count
from datetime import timedelta
from calendar import month_abbr
from .utils.encryption import decrypt_value
from django.utils.timezone import now

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ---------------- AUTH ----------------

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response(
            {"user": UserSerializer(user).data, "tokens": tokens},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        print("Login attempt - Data received:", request.data)
        
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            print("Login validation errors:", serializer.errors)
            return Response(
                {"detail": "Invalid email or password"},
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)
        
        # Ensure all user data is serialized
        user_data = UserSerializer(user).data
        print(f"DEBUG Login: User {user.email} is_flagged = {user.is_flagged}")
        
        return Response(
            {"user": user_data, "tokens": tokens},  # Make sure to use serializer
            status=status.HTTP_200_OK,
        )

class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        access_token = request.data.get("access_token")
        if not access_token:
            return Response(
                {"detail": "Missing access_token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            google_resp = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=5,
            )
        except requests.RequestException:
            return Response(
                {"detail": "Failed to contact Google."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if google_resp.status_code != 200:
            return Response(
                {"detail": "Invalid Google token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = google_resp.json()
        email = data.get("email")
        name = data.get("name") or data.get("given_name") or ""

        if not email:
            return Response(
                {"detail": "Google account has no email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"name": name or email.split("@")[0]},
        )

        tokens = get_tokens_for_user(user)

        return Response(
            {"user": UserSerializer(user).data, "tokens": tokens},
            status=status.HTTP_200_OK,
        )


# -------------- PROFILE (EDUCATION + CERTS) ----------------

class ProfileView(APIView):
    """
    GET: fetch current user's profile (education + certifications)
    PUT: update education details
    """

    def get(self, request):
        user = request.user
    
    # Debug logging
        print(f"DEBUG ProfileView: User {user.email} is_flagged = {user.is_flagged}")
    
        education = Education.objects.filter(user=user).first()
        certs = Certification.objects.filter(user=user)
    
        education_data = EducationSerializer(education).data if education else None
    
        return Response(
            {
                "user": UserSerializer(user).data,  # Use serializer here
                "education": education_data,
                "certifications": CertificationSerializer(certs, many=True).data,
            }
        )

    def put(self, request):
        user = request.user
        
        print("=" * 50)
        print(f"DEBUG PUT: Received data from {user.email}")
        print(f"Full request data: {request.data}")
        print("=" * 50)
        
        # Handle both nested and flat data formats
        if 'education' in request.data:
            edu_data = request.data.get("education", {})
        else:
            edu_data = request.data
        
        print(f"DEBUG: Processing education data: {edu_data}")

        skills = request.data.get("skills", None)

        if skills is not None:
            user.skills = skills
            user.save()

        # Check if education exists
        education = Education.objects.filter(user=user).first()
        
        try:
            if education:
                # Update existing education
                serializer = EducationSerializer(
                    instance=education, 
                    data=edu_data, 
                    partial=True
                )
            else:
                # Create new education
                serializer = EducationSerializer(data=edu_data)
            
            # Validate and save
            if serializer.is_valid():
                print(f"DEBUG: Validated data: {serializer.validated_data}")
                serializer.save(user=user)
                
                # Get the updated education data
                saved_education = Education.objects.filter(user=user).first()
                response_data = EducationSerializer(saved_education).data
                
                print(f"DEBUG: Saved successfully. Returning: {response_data}")
                
                return Response(
                    {
                        "message": "Profile updated successfully",
                        "education": response_data
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                print(f"DEBUG: Validation errors: {serializer.errors}")
                return Response(
                    {
                        "error": "Validation failed",
                        "details": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Exception as e:
            print(f"DEBUG: Error updating profile: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {
                    "detail": "Failed to update profile",
                    "error": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

# -------------- CERTIFICATIONS ----------------

class CertificationCreateView(generics.CreateAPIView):
    serializer_class = CertificationSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CertificationDetailView(generics.DestroyAPIView):
    serializer_class = CertificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Certification.objects.filter(user=self.request.user)


# -------------- PREDICTION HISTORY ----------------

class PredictionHistoryListCreateView(generics.ListCreateAPIView):
    serializer_class = PredictionHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PredictionHistory.objects.filter(
            user=self.request.user
        ).order_by("-timestamp")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PredictionHistoryDetailView(generics.DestroyAPIView):
    serializer_class = PredictionHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PredictionHistory.objects.filter(user=self.request.user)

class JobPredictionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        education = Education.objects.filter(user=user).first()

        if not education:
            return Response(
                {"error": "Education details not found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = {
            "degree": education.degree,
            "specialization": education.specialization,
            "course": education.specialization,
            "college": education.university,
            "year_of_completion": education.year_of_completion,
            "cgpa": float(education.cgpa),
            "skills": user.skills or [],

            "certifications": list(
                Certification.objects.filter(user=user)
                .values_list("cert_name", flat=True)
            ),
        }

        predictions = predict_jobs(data)

        # ✅ SAVE HISTORY (THIS WAS MISSING)
        top_roles = [p["job_role"] for p in predictions[:3]]
        confidences = [float(p["confidence"]) for p in predictions[:3]]

        # PredictionHistory.objects.create(
        #     user=user,
        #     predicted_roles=top_roles,
        #     confidence_scores=confidences,
        # )
        
        PredictionHistory.objects.create(
            user=user,
            predicted_roles=[p["job_role"] for p in predictions],
            confidence_scores=[p["confidence"] for p in predictions],
            missing_skills=[p["missing_skills"] for p in predictions]
        )
        return Response(
            {"predictions": predictions},
            status=status.HTTP_200_OK
        )

# -------------- TEST ENCRYPTION ----------------

class TestEncryptionView(APIView):
    """Test endpoint to check encryption is working"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        from .utils.encryption import encrypt_value, decrypt_value
        
        test_text = request.data.get("text", "Test University")
        
        try:
            encrypted = encrypt_value(test_text)
            decrypted = decrypt_value(encrypted)
            
            return Response({
                "original": test_text,
                "encrypted": encrypted,
                "decrypted": decrypted,
                "success": decrypted == test_text
            })
        except Exception as e:
            return Response({
                "error": str(e),
                "test_text": test_text
            }, status=400)
            
# -------------- ADMIN ANALYTICS ----------------           
class AdminAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        now = timezone.now()

        # ---------------- USERS ----------------
        total_users = User.objects.count()
        students = User.objects.filter(role="student").count()
        admins = User.objects.filter(role="admin").count()

        # ---------------- PREDICTIONS ----------------
        predictions = PredictionHistory.objects.all()
        total_predictions = predictions.count()

        monthly_predictions = predictions.filter(
            timestamp__month=now.month,
            timestamp__year=now.year
        ).count()

        # ---------------- AVG CONFIDENCE ----------------
        confidences = []
        for p in predictions:
            confidences.extend(p.confidence_scores or [])

        avg_confidence = round(
            sum(confidences) / len(confidences), 2
        ) if confidences else 0

        # ---------------- UNIVERSITIES ----------------
        universities_map = {}
        for edu in Education.objects.all():
            uni = decrypt_value(edu.university) if edu.university else "Unknown"
            universities_map[uni] = universities_map.get(uni, 0) + 1

        universities = [
            {"name": k, "count": v}
            for k, v in universities_map.items()
        ]

        # ---------------- TOP JOBS ----------------
        job_counter = {}
        for p in predictions:
            for job in p.predicted_roles:
                job_counter[job] = job_counter.get(job, 0) + 1

        top_jobs = sorted(
            [{"job": k, "count": v} for k, v in job_counter.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:5]

        # ---------------- DAILY PREDICTIONS (7 days) ----------------
        daily_predictions = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            count = predictions.filter(
                timestamp__date=day.date()
            ).count()

            daily_predictions.append({
                "day": day.strftime("%a"),
                "predictions": count
            })

        # ---------------- USER GROWTH ----------------
        user_growth = []
        for m in range(1, now.month + 1):
            month_users = User.objects.filter(
                last_login__month=m
            ).count()

            user_growth.append({
                "month": month_abbr[m],
                "users": month_users,
                "active": month_users  # can improve later
            })

        return Response({
            "total_users": total_users,
            "students": students,
            "admins": admins,
            "total_predictions": total_predictions,
            "monthly_predictions": monthly_predictions,
            "avg_confidence": avg_confidence,
            "accuracy": 82,  # static for now (can be ML based later)
            "universities": universities,
            "top_jobs": top_jobs,
            "daily_predictions": daily_predictions,
            "user_growth": user_growth,
        })
                
class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        users = User.objects.all().values(
            "id", "name", "email", "role", "date_joined", "is_flagged", "flag_reason",
        )
        return Response(users)


class AdminUpdateUserRoleView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        user = User.objects.get(id=user_id)
        old_role = user.role
        user.role = request.data.get("role")
        user.save()

        AdminLog.objects.create(
            admin=request.user,
            action_type=f"ROLE_UPDATED_{old_role.upper()}_TO_{user.role.upper()}",
            target_user=user
        )

        return Response({"status": "role updated"})


class AdminDeleteUserView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        user = User.objects.get(id=user_id)

        AdminLog.objects.create(
            admin=request.user,
            action_type="USER_DELETED",
            target_user=user
        )

        user.delete()
        return Response(status=204)


class AdminModelStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        total = PredictionHistory.objects.count()
        trained = int(total * 0.98)

        return Response({
            "trained": trained,
            "total": total,
            "coverage": 100
        })


class AdminRetrainModelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        AdminLog.objects.create(
            admin=request.user,
            action_type="TRAINING_STARTED"
        )

        retrain_model_from_csv()
        AdminLog.objects.create(
            admin=request.user,
            action_type="TRAINING_COMPLETED"
        )

        return Response({"status": "model retrained"})


class AdminPredictionLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        logs = PredictionHistory.objects.select_related("user").order_by("-timestamp")

        data = []
        for p in logs:
            for job, conf in zip(p.predicted_roles, p.confidence_scores):
                data.append({
                    "user": p.user.email,
                    "predicted_job": job,
                    "confidence": conf,
                    "status": "success",
                    "timestamp": p.timestamp
                })

        return Response(data)


class PredictionFeedbackCreateView(generics.CreateAPIView):
    serializer_class = PredictionFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AdminPredictionFeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        feedbacks = PredictionFeedback.objects.select_related(
            "user", "prediction"
        ).order_by("-created_at")

        data = []
        for f in feedbacks:
            data.append({
                "user": f.user.email,
                "rating": f.rating,
                "comment": f.comment,
                "created_at": f.created_at,
                "predicted_roles": f.prediction.predicted_roles,
            })

        return Response(data)

class AdminLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only admins can see system logs
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        logs = AdminLog.objects.select_related(
            "admin", "target_user"
        ).order_by("-timestamp")

        data = []
        for log in logs:
            data.append({
                "id": log.id,
                "time": log.timestamp.isoformat(),  # ✅ JS-safe
                "admin": log.admin.email if log.admin else "—",
                "action": log.action_type or "—",
                "target": log.target_user.email if log.target_user else "System",
                "details": log.details or "—",
                "is_flagged": log.is_flagged,
            })

        return Response(data)

class AdminFlagUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        reason = request.data.get("reason", "").strip()
        
        # ACTUALLY FLAG THE USER
        target_user.is_flagged = True
        target_user.flag_reason = reason
        target_user.save()

        # Create log entry
        AdminLog.objects.create(
            admin=request.user,
            target_user=target_user,
            action_type="USER_FLAGGED",
            details=reason or "No reason provided"
        )

        return Response({
            "status": "user flagged successfully",
            "user_id": target_user.id,
            "email": target_user.email,
            "is_flagged": target_user.is_flagged
        })

class AdminUpdateUserRoleView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        from accounts.models import User

        user = User.objects.get(id=user_id)
        new_role = request.data.get("role")

        if not new_role:
            return Response({"detail": "Role is required"}, status=400)

        old_role = user.role
        user.role = new_role
        user.save()

        # ✅ LOG WITH DETAILS (THIS FIXES YOUR ISSUE)
        AdminLog.objects.create(
            admin=request.user,
            target_user=user,
            action_type="ROLE_UPDATED",
            details=f"Role changed from {old_role} to {new_role}"
        )

        return Response({"status": "role updated"})


class AdminRetrainModelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        csv_file = request.FILES.get("file")

        if not csv_file:
            return Response({"detail": "CSV file required"}, status=400)

        try:
            retrain_model_from_csv(csv_file)

            AdminLog.objects.create(
                admin=request.user,
                action_type="MODEL_RETRAINED",
                details="Model retrained using CSV upload"
            )

            return Response({"status": "Model retrained successfully"})

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=400
            )


class SupportTicketCreateView(generics.CreateAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
class AdminSupportStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        open_count = SupportTicket.objects.filter(status="open").count()
        return Response({"open_tickets": open_count})


class AdminSupportReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        ticket = SupportTicket.objects.get(pk=pk)
        ticket.admin_reply = request.data.get("reply")
        ticket.status = "resolved"
        ticket.replied_at = now()
        ticket.save()

        return Response({"message": "Reply saved"})


class AdminSupportTicketListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        tickets = SupportTicket.objects.all().order_by("-created_at")
        serializer = SupportTicketSerializer(tickets, many=True)
        return Response(serializer.data)

class MySupportTicketsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tickets = SupportTicket.objects.filter(user=request.user).order_by("-created_at")
        serializer = SupportTicketSerializer(tickets, many=True)
        return Response(serializer.data)

class SupportTicketDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            ticket = SupportTicket.objects.get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)

        # Admin can delete any ticket
        if request.user.role == "admin":
            ticket.delete()
            return Response({"detail": "Deleted"}, status=204)

        # User can delete only their own ticket
        if ticket.user != request.user:
            return Response({"detail": "Unauthorized"}, status=403)

        ticket.delete()
        return Response({"detail": "Deleted"}, status=204)


class FlagUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        print("FLAG USER API HIT:", user_id)  # 🔍 DEBUG

        if request.user.role != "admin":
            print("NOT ADMIN:", request.user.email)
            return Response({"detail": "Unauthorized"}, status=403)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            print("USER NOT FOUND")
            return Response({"detail": "User not found"}, status=404)

        reason = request.data.get("reason", "No reason provided")

        user.is_flagged = True
        user.flag_reason = reason
        user.save()

        print("USER FLAGGED:", user.email, user.is_flagged)

        return Response({
            "message": "User flagged successfully",
            "email": user.email,
            "is_flagged": user.is_flagged
        })    
    
class UnflagUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role != "admin":
            return Response({"detail": "Unauthorized"}, status=403)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        # Unflag the user
        user.is_flagged = False
        user.flag_reason = ""
        user.save()

        # Create log entry
        AdminLog.objects.create(
            admin=request.user,
            target_user=user,
            action_type="USER_UNFLAGGED",
            details=f"User {user.email} unflagged"
        )

        return Response({
            "message": "User unflagged successfully",
            "user_id": user.id,
            "email": user.email,
            "is_flagged": user.is_flagged
        })