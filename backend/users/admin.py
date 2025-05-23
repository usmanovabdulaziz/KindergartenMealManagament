from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Role, User

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at', 'updated_at')
    list_filter = ('name',)
    search_fields = ('name',)
    ordering = ('name',)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('id', 'username', 'email', 'role', 'is_active', 'is_staff', 'created_at', 'updated_at')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('username', 'email')
    ordering = ('username',)

    # Foydalanuvchi tahrirlash va ko‘rish uchun maydonlar
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Personal Info', {'fields': ('role', 'is_active', 'is_staff')}),
        ('Permissions', {'fields': ('is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('created_at', 'updated_at')}),
    )

    # Yangi foydalanuvchi qo‘shish uchun forma
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'is_active', 'is_staff', 'is_superuser'),
        }),
    )

    readonly_fields = ('created_at', 'updated_at')

    def save_model(self, request, obj, form, change):
        # Parolni to‘g‘ri hash qilish uchun
        if 'password1' in form.cleaned_data:
            obj.set_password(form.cleaned_data['password1'])
        elif not change or (change and 'password' in form.changed_data):
            obj.set_password(form.cleaned_data['password'])
        super().save_model(request, obj, form, change)