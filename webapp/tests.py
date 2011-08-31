# Adapted from http://stackoverflow.com/questions/2380527/django-doctests-in-views-py

from unittest import TestSuite
from doctest import DocTestSuite

import helpers

def suite():
    testsuite = TestSuite()
    testsuite.addTest(DocTestSuite(helpers))
    return testsuite