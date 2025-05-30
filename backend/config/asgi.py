import os
from django.core.asgi import get_asgi_application

# Avval Django sozlamalarini o'rnatish
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django_application = get_asgi_application()

# Keyin Channels komponentlarini import qilish
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator


# Django ilovalari yuklanganidan keyin routinglarni import qilish
def get_websocket_application():
    import meals.routing
    import inventory.routing
    import reports.routing

    return AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                meals.routing.websocket_urlpatterns +
                inventory.routing.websocket_urlpatterns +
                reports.routing.websocket_urlpatterns
            )
        )
    )


application = ProtocolTypeRouter({
    "http": django_application,
    "websocket": get_websocket_application(),
})