class ApiError(Exception):
  code = 500
  reason = None

  def __init__(self, code=None, reason=None):
    if code is not None:
      self.code = int(code)
    if reason is not None:
      self.reason = reason

  def __str__(self):
    return '%d:%s' % (self.code, self.reason)

class BadRequest(ApiError):
  code = 400

  def __init__(self, reason):
    super(BadRequest, self).__init__(self.code, reason)

class Unauthorized(ApiError):
  code = 401
  reason = 'Unauthorized'

class Conflict(ApiError):
  code = 409
  reason = 'Conflict'

class VideoNotFound(BadRequest):
  code = 404

  def __init__(self, id):
    super(VideoNotFound, self).__init__('Video:%s not found' % id)
