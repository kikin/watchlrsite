import logging, logging.config

def init():
  logger = logging.getLogger('shorten')
  logger.setLevel(logging.DEBUG)
  handler = logging.handlers.TimedRotatingFileHandler(
                'error.log',
                when='midnight',
                interval=1,
                backupCount=7)
  formatter = logging.Formatter(
                  "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
  handler.setFormatter(formatter)
  logger.addHandler(handler)

initDone = False
if not initDone:
  initDone = True
  init()
  