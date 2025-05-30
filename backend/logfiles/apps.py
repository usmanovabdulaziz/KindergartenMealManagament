from django.apps import AppConfig

class LogfilesConfig(AppConfig):
    name = 'logfiles'

    def ready(self):
        import logfiles.signals