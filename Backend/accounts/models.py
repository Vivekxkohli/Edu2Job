from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
import decimal


class UserManager(BaseUserManager):
    def create_user(self, email, name="", password=None, role="student", **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name="", password=None, **extra_fields):
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, name=name, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, default="student")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)  
    skills = models.JSONField(default=list, blank=True)
    objects = UserManager()
    is_flagged = models.BooleanField(default=False)
    flag_reason = models.CharField(max_length=255, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    def __str__(self) -> str:
        return self.email


class Education(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="educations")
    degree = models.TextField(blank=True, null=True)
    specialization = models.TextField(blank=True, null=True)
    university = models.TextField(blank=True, null=True)
    cgpa = models.DecimalField(
        max_digits=4,
        decimal_places=2, 
        blank=True, 
        null=True,
    )
    year_of_completion = models.IntegerField(blank=True, null=True)

    def save(self, *args, **kwargs):
        # Clean CGPA before saving
        if self.cgpa is not None:
            try:
                # Ensure it's a valid Decimal
                if isinstance(self.cgpa, (int, float)):
                    self.cgpa = decimal.Decimal(str(self.cgpa))
                elif isinstance(self.cgpa, str):
                    # Clean string - remove non-numeric except decimal point
                    cleaned = ''.join(c for c in self.cgpa if c.isdigit() or c == '.')
                    if cleaned:
                        self.cgpa = decimal.Decimal(cleaned)
                    else:
                        self.cgpa = None
            except (ValueError, TypeError, decimal.InvalidOperation):
                self.cgpa = None
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.user.email} - {self.degree if self.degree else 'No Degree'}"


class Certification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="certifications")
    cert_name = models.TextField()
    issuing_organization = models.TextField()
    issue_date = models.DateField()

    def __str__(self) -> str:
        return f"{self.user.email} - {self.cert_name}"


class PredictionHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="predictions")
    predicted_roles = models.JSONField()
    confidence_scores = models.JSONField()
    missing_skills = models.JSONField(default=list)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.user.email} - {self.predicted_roles}"


class AdminLog(models.Model):
    admin = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="admin_logs"
    )

    target_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="target_logs",
        null=True,
        blank=True
    )

    action_type = models.CharField(
        max_length=50,
        help_text="Type of admin action (e.g. ROLE_UPDATED, USER_FLAGGED)"
    )

    details = models.TextField(
        null=True,
        blank=True,
        help_text="Human readable explanation of the action"
    )

    is_flagged = models.BooleanField(
        default=False,
        help_text="Whether this log entry is flagged for review"
    )

    timestamp = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        target = self.target_user.email if self.target_user else "System"
        return f"{self.action_type} | {target}"

    
class PredictionFeedback(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="prediction_feedbacks"
    )
    prediction = models.ForeignKey(
        PredictionHistory,
        on_delete=models.CASCADE,
        related_name="feedbacks"
    )
    rating = models.IntegerField()  # 1 to 5
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.rating}⭐"

class SupportTicket(models.Model):
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    type = models.CharField(max_length=20)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, default="open")
    created_at = models.DateTimeField(auto_now_add=True)
    admin_reply = models.TextField(blank=True, null=True)
    replied_at = models.DateTimeField(blank=True, null=True)


    def __str__(self):
        return self.subject
