_jc = None
def hook_johnny_cache():
    from django.conf import settings
    if 'johnny.middleware.QueryCacheMiddleware' in settings.MIDDLEWARE_CLASSES:
        from johnny import middleware
        global _jc
        if _jc is None:
            _jc = middleware.QueryCacheMiddleware()