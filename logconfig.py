import os, logging, logging.config

def init():
    logging.basicConfig(level=logging.DEBUG)

    logger = logging.getLogger('kikinvideo')
    logger.setLevel(logging.DEBUG)

    env = os.environ.get('VIDEO_ENV', 'local')
    file = 'error.log'
    if not env == 'local':
        file = '/opt/video_env/logs/' + file
    handler = logging.handlers.TimedRotatingFileHandler(file, when='midnight', interval=1, backupCount=7)

    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    handler.setFormatter(formatter)

    logger.addHandler(handler)

initDone = False
if not initDone:
    initDone = True
    init()
