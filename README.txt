IMPORTANT:
	This project now has dependencies:

		django-socialregistration:
			simple interface for user authentication through facebook graph API
		
		pyFacebook:
			a dependency of django-socialregistration
			
before running/working on the app, install these dependencies:
	i.e:
		'cd dependencies'
		'cd django-socialregistration'
		'sudo python setup.py install'
		'cd ..'
		'cd pyfacebook'
		'sudo python setup.py install'

Perhaps this goes without saying, but if you keep multiple versions of the python interpreter on your machine, make sure that these modules get installed to the site-packages directory for the version that will be used to run this app.
			