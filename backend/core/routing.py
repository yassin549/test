from django.urls import re_path
from games.routing import websocket_urlpatterns as games_ws_patterns

websocket_urlpatterns = games_ws_patterns + [
    # Additional WebSocket routes can be added here
]
