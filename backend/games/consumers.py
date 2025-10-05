import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from decimal import Decimal
from .models import Round
from .services import RoundsEngine, RoundSimulator


class RoundsConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for broadcasting round events
    """
    
    async def connect(self):
        self.room_group_name = 'rounds'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send current round state to newly connected client
        await self.send_current_round_state()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong',
                'timestamp': timezone.now().isoformat()
            }))
    
    async def send_current_round_state(self):
        """Send current round state to client"""
        round_obj = await self.get_current_round()
        
        if round_obj.state == 'PRE_ROUND':
            await self.send(text_data=json.dumps({
                'type': 'round:pre',
                'data': {
                    'round_id': round_obj.id,
                    'server_hash': round_obj.server_seed_hash,
                    'countdown': 10,  # Should calculate actual countdown
                    'timestamp': timezone.now().isoformat()
                }
            }))
        elif round_obj.state == 'FLYING':
            multiplier = await self.calculate_multiplier(round_obj)
            await self.send(text_data=json.dumps({
                'type': 'round:tick',
                'data': {
                    'round_id': round_obj.id,
                    'multiplier': float(multiplier),
                    'timestamp': timezone.now().isoformat()
                }
            }))
        elif round_obj.state == 'CRASHED':
            await self.send(text_data=json.dumps({
                'type': 'round:crash',
                'data': {
                    'round_id': round_obj.id,
                    'crash_multiplier': float(round_obj.crash_multiplier),
                    'server_seed': round_obj.server_seed_revealed,
                    'timestamp': timezone.now().isoformat()
                }
            }))
    
    # Broadcast handlers
    async def round_pre(self, event):
        """Broadcast pre-round event"""
        await self.send(text_data=json.dumps({
            'type': 'round:pre',
            'data': event['data']
        }))
    
    async def round_tick(self, event):
        """Broadcast tick event"""
        await self.send(text_data=json.dumps({
            'type': 'round:tick',
            'data': event['data']
        }))
    
    async def round_crash(self, event):
        """Broadcast crash event"""
        await self.send(text_data=json.dumps({
            'type': 'round:crash',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_current_round(self):
        """Get current round from database"""
        return RoundsEngine.get_current_round()
    
    @database_sync_to_async
    def calculate_multiplier(self, round_obj):
        """Calculate current multiplier"""
        if round_obj.start_time:
            return RoundSimulator.calculate_current_multiplier(
                round_obj.start_time,
                round_obj.crash_multiplier
            )
        return Decimal('1.00')
