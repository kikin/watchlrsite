#  Each query is accompanied with trace of their origin

#import traceback
#
#from django.conf import settings
#from django.db.backends import util
#
#class PrintQueryWrapper(util.CursorDebugWrapper):
#    def execute(self, sql, params=()):
#        sql += "-- %s" % ''.join([str(info[0])+':'+str(info[1]) for info in traceback.extract_stack()])
#        return super(PrintQueryWrapper, self).execute(sql, params)
#
#if settings.DEBUG:
#    util.CursorDebugWrapper = PrintQueryWrapper