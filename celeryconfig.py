# List of modules to import when celery starts.
CELERY_IMPORTS = ("api.tasks", )

# broker settings
BROKER_HOST = "localhost"
BROKER_PORT = 5672
BROKER_USER = "guest"
BROKER_PASSWORD = "guest"
BROKER_VHOST = "/"

# No tasks currently produce results or use rate limits
CELERY_IGNORE_RESULT = True
CELERY_DISABLE_RATE_LIMITS = True

CELERY_ALWAYS_EAGER = True
TEST_RUNNER = 'djcelery.contrib.test_runner.run_tests'

CELERYD_CONCURRENCY = 25
