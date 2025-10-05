from django.contrib import admin
from .models import Deposit


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'amount_tnd', 'pay_currency', 'status', 'created_at', 'completed_at']
    list_filter = ['status', 'pay_currency', 'created_at']
    search_fields = ['user__username', 'invoice_id', 'order_id']
    readonly_fields = ['created_at', 'updated_at', 'invoice_id', 'order_id']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Payment Details', {
            'fields': ('invoice_id', 'order_id', 'pay_address', 'pay_amount', 'pay_currency', 'amount_tnd', 'rate_used')
        }),
        ('Status', {
            'fields': ('status', 'required_confirmations', 'current_confirmations')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'expires_at', 'completed_at')
        }),
        ('Additional Data', {
            'fields': ('meta',),
            'classes': ('collapse',)
        }),
    )
