from django.contrib import admin
from .models import User, Education, Certification, PredictionHistory, AdminLog


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "name", "role", "is_staff")
    search_fields = ("email", "name")
    list_filter = ("role",)


admin.site.register(Education)
admin.site.register(Certification)
admin.site.register(PredictionHistory)
admin.site.register(AdminLog)
