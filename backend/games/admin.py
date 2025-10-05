from django.contrib import admin
from .models import UserProfile, Round, Bet, LedgerEntry


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance_tnd', 'created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Round)
class RoundAdmin(admin.ModelAdmin):
    list_display = ['id', 'state', 'crash_multiplier', 'start_time', 'created_at']
    list_filter = ['state', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    search_fields = ['id', 'server_seed_hash']


@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'round', 'amount_tnd', 'status', 'cashed_out_multiplier', 'win_amount_tnd', 'placed_at']
    list_filter = ['status', 'placed_at']
    search_fields = ['user__username', 'round__id']
    readonly_fields = ['placed_at', 'cashed_out_at']


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'type', 'amount_tnd', 'balance_before', 'balance_after', 'timestamp']
    list_filter = ['type', 'timestamp']
    search_fields = ['user__username']
    readonly_fields = ['timestamp']
