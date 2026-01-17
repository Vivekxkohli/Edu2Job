from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Education, Certification, PredictionHistory, PredictionFeedback, SupportTicket
from .utils.encryption import encrypt_value, decrypt_value
import decimal


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "name",
            "email",
            "role",
            "is_flagged",
            "flag_reason",
            "date_joined",     # Optional but good to have
            "skills",
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "name", "email", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password")
        data["user"] = user
        return data


class EducationSerializer(serializers.ModelSerializer):
    # Main fields for frontend display - always return decrypted values
    degree = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    university = serializers.SerializerMethodField()
    
    # Write-only fields that accept input from frontend
    degree_write = serializers.CharField(
        write_only=True, 
        required=False, 
        allow_blank=True,
        allow_null=True
    )
    specialization_write = serializers.CharField(
        write_only=True, 
        required=False, 
        allow_blank=True,
        allow_null=True
    )
    university_write = serializers.CharField(
        write_only=True, 
        required=False, 
        allow_blank=True,
        allow_null=True
    )
    cgpa_write = serializers.CharField(
        write_only=True, 
        required=False, 
        allow_blank=True,
        allow_null=True
    )
    
    # Field to track if "Other" was selected
    degree_other = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        allow_null=True
    )

    class Meta:
        model = Education
        fields = [
            "id", 
            "degree", "specialization", "university", "cgpa",
            "year_of_completion", 
            "degree_write", "specialization_write", "university_write", 
            "cgpa_write", "degree_other"
        ]
        read_only_fields = ["id", "degree", "specialization", "university", "cgpa"]

    def get_degree(self, obj):
        """Return decrypted degree value for display"""
        if obj.degree:
            try:
                return decrypt_value(obj.degree)
            except:
                return obj.degree
        return None

    def get_specialization(self, obj):
        """Return decrypted specialization value for display"""
        if obj.specialization:
            try:
                return decrypt_value(obj.specialization)
            except:
                return obj.specialization
        return None

    def get_university(self, obj):
        """Return decrypted university value for display"""
        if obj.university:
            try:
                return decrypt_value(obj.university)
            except:
                return obj.university
        return None

    # ---------- Smart normalization helpers ----------

    def _normalize_degree(self, value: str) -> str:
        if not value or not value.strip():
            return ""
        
        text = value.strip().lower()
        
        # Handle "Other" special case
        if text == "other" or text == "":
            return ""
        
        mapping = {
            "btech": "B.Tech",
            "b.tech": "B.Tech",
            "b tech": "B.Tech",
            "bachelor of technology": "B.Tech",
            "be": "B.E.",
            "b.e.": "B.E.",
            "bachelor of engineering": "B.E.",
            "bsc": "B.Sc",
            "b.sc": "B.Sc",
            "bachelor of science": "B.Sc",
            "bca": "BCA",
            "mtech": "M.Tech",
            "m.tech": "M.Tech",
            "master of technology": "M.Tech",
            "msc": "M.Sc",
            "m.sc": "M.Sc",
            "master of science": "M.Sc",
            "mca": "MCA",
            "mba": "MBA",
            "master of business administration": "MBA",
            "ba": "B.A.",
            "b.a.": "B.A.",
            "bachelor of arts": "B.A.",
            "ma": "M.A.",
            "m.a.": "M.A.",
            "master of arts": "M.A.",
            "phd": "Ph.D",
            "ph.d": "Ph.D",
            "doctor of philosophy": "Ph.D",
        }

        for key, standard_value in mapping.items():
            if key in text:
                return standard_value

        # default: clean spaces + nice case
        return value.strip().title()

    def _normalize_text(self, value: str) -> str:
        if not value:
            return ""
        # Generic cleaner for specialization + university
        return " ".join(value.strip().split()).title()

    # ---------- Validation methods ----------

    def validate_degree_write(self, value):
        """Validate degree from dropdown (not "Other")"""
        if not value or not value.strip():
            return ""
        
        normalized = self._normalize_degree(value)
        if not normalized:  # If normalization returns empty (e.g., "Other" was selected)
            return ""
        
        # Encrypt before saving
        try:
            return encrypt_value(normalized)
        except Exception as e:
            print(f"Degree encryption error: {e}")
            return normalized

    def validate_degree_other(self, value):
        """Validate custom degree when "Other" is selected"""
        if not value or not value.strip():
            return ""
        
        normalized = value.strip().title()
        
        # Encrypt before saving
        try:
            return encrypt_value(normalized)
        except Exception as e:
            print(f"Degree (Other) encryption error: {e}")
            return normalized

    def validate_specialization_write(self, value):
        """Validate and encrypt specialization input"""
        if not value or not value.strip():
            return ""
        normalized = self._normalize_text(value)
        # Encrypt before saving
        try:
            return encrypt_value(normalized)
        except Exception as e:
            print(f"Specialization encryption error: {e}")
            return normalized

    def validate_university_write(self, value):
        """Validate and encrypt university input"""
        if not value or not value.strip():
            return ""
        normalized = self._normalize_text(value)
        # Encrypt before saving
        try:
            return encrypt_value(normalized)
        except Exception as e:
            print(f"University encryption error: {e}")
            return normalized

    def validate_cgpa_write(self, value):
        """
        Handle CGPA input from frontend
        """
        if not value or value.strip() == "":
            return None
            
        try:
            # Remove any non-numeric characters except decimal point
            cleaned = ''.join(c for c in value if c.isdigit() or c == '.')
            if not cleaned:
                return None
                
            cgpa_val = float(cleaned)
        except (TypeError, ValueError):
            raise serializers.ValidationError("CGPA must be a valid number.")

        if cgpa_val < 0 or cgpa_val > 10:
            raise serializers.ValidationError("CGPA must be between 0 and 10.")

        # Convert to Decimal with 2 decimal places
        cgpa_val = decimal.Decimal(str(cgpa_val)).quantize(decimal.Decimal('0.01'))
        return cgpa_val

    def validate_year_of_completion(self, value):
        """
        Ensure year is realistic (e.g. 2000–2100).
        Accept string or int.
        """
        if value in [None, "", "null", "undefined"]:
            return None
            
        try:
            year = int(value)
        except (TypeError, ValueError):
            raise serializers.ValidationError("Year of completion must be a valid year (e.g. 2026).")

        if year < 2000 or year > 2100:
            raise serializers.ValidationError("Year of completion must be between 2000 and 2100.")

        return year

    # ---------- Handle field mapping and "Other" logic ----------

    def to_internal_value(self, data):
        """
        Map frontend field names and handle "Other" degree logic
        """
        processed_data = {}
        
        # Copy all existing data
        for key, value in data.items():
            processed_data[key] = value
        
        # Check if we have degree_other (custom degree when "Other" is selected)
        has_degree_other = 'degree_other' in processed_data and processed_data['degree_other']
        
        # Check if degree_write is "Other" or empty
        degree_write = processed_data.get('degree_write', '')
        is_other_selected = (degree_write and degree_write.lower() == 'other') or has_degree_other
        
        if is_other_selected and has_degree_other:
            # Use degree_other instead of degree_write
            processed_data['degree_other'] = processed_data.pop('degree_other', '')
            # Clear degree_write since we're using degree_other
            processed_data.pop('degree_write', None)
        elif 'degree' in processed_data and 'degree_write' not in processed_data:
            # Map old field name
            degree_val = processed_data.pop('degree')
            if degree_val and degree_val.lower() != 'other':
                processed_data['degree_write'] = degree_val
        
        # Map other old field names
        field_mapping = {
            'specialization': 'specialization_write',
            'university': 'university_write',
            'cgpa': 'cgpa_write'
        }
        
        for frontend_field, serializer_field in field_mapping.items():
            if frontend_field in processed_data and serializer_field not in processed_data:
                processed_data[serializer_field] = processed_data.pop(frontend_field)
        
        # Pre-fill existing values for display
        if self.instance:
            # Pre-fill CGPA if not provided
            if self.instance.cgpa and 'cgpa_write' not in processed_data:
                processed_data['cgpa_write'] = str(self.instance.cgpa)
            
            # Pre-fill year if not provided
            if self.instance.year_of_completion and 'year_of_completion' not in processed_data:
                processed_data['year_of_completion'] = self.instance.year_of_completion
        
        return super().to_internal_value(processed_data)

    def to_representation(self, instance):
        """Customize the output representation"""
        representation = super().to_representation(instance)
        
        # Remove write-only fields from the response
        write_only_fields = [
            'degree_write', 'specialization_write', 'university_write', 
            'cgpa_write', 'degree_other'
        ]
        for field in write_only_fields:
            representation.pop(field, None)
        
        return representation

    def create(self, validated_data):
        """Create education record with encrypted fields"""
        # Extract degree fields
        degree_write = validated_data.pop('degree_write', None)
        degree_other = validated_data.pop('degree_other', None)
        
        # Use degree_other if provided, otherwise use degree_write
        if degree_other:
            validated_data['degree'] = degree_other
        elif degree_write:
            validated_data['degree'] = degree_write
        
        # Extract other fields
        specialization_write = validated_data.pop('specialization_write', None)
        university_write = validated_data.pop('university_write', None)
        cgpa_write = validated_data.pop('cgpa_write', None)
        
        # Map other fields
        if specialization_write is not None:
            validated_data['specialization'] = specialization_write
        if university_write is not None:
            validated_data['university'] = university_write
        if cgpa_write is not None:
            validated_data['cgpa'] = cgpa_write
            
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update education record with encrypted fields"""
        # Extract degree fields
        degree_write = validated_data.pop('degree_write', None)
        degree_other = validated_data.pop('degree_other', None)
        
        # Handle degree: use degree_other if provided, otherwise use degree_write
        if degree_other is not None:
            validated_data['degree'] = degree_other
        elif degree_write is not None:
            # Only update if degree_write is not empty and not "Other"
            if degree_write and degree_write.lower() != 'other':
                validated_data['degree'] = degree_write
            elif degree_write == '':
                # Clear the degree field if empty string is sent
                validated_data['degree'] = ''
        
        # Extract other fields
        specialization_write = validated_data.pop('specialization_write', None)
        university_write = validated_data.pop('university_write', None)
        cgpa_write = validated_data.pop('cgpa_write', None)
        
        # Map other fields if provided
        if specialization_write is not None:
            validated_data['specialization'] = specialization_write
        if university_write is not None:
            validated_data['university'] = university_write
        if cgpa_write is not None:
            validated_data['cgpa'] = cgpa_write
            
        return super().update(instance, validated_data)


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ["id", "cert_name", "issuing_organization", "issue_date"]


class PredictionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionHistory
        fields = ["id", "predicted_roles", "confidence_scores", "timestamp"]
        
class PredictionFeedbackSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = PredictionFeedback
        fields = [
            "id",
            "user_email",
            "prediction",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["user_email", "created_at"]


class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = "__all__"
        read_only_fields = ["user", "created_at"]
