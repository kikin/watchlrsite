import os, logging, logging.config

def init(debug=False):
    level = logging.DEBUG if debug else logging.INFO

    logging.basicConfig(level=level)

    logger = logging.getLogger('kikinvideo')
    logger.setLevel(level)

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

    video_env = os.environ.get('VIDEO_ENV', 'local')
    debug = video_env.startswith('local')

    init(debug=debug)
