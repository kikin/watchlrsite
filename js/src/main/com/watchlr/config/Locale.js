$.Class.extend("com.watchlr.config.Locale", {
    'en-US': {
        'DateFormat': {
			'just_now': 'just now',
			'a_minute': '1 minute',
			'minutes': 'minutes',
			'a_hour': '1 Hour',
			'hours': 'hours',
			'a_day': '1 day',
			'days': 'days',
			'a_week': '1 week',
			'weeks': 'weeks',
			'a_month': '1 month',
			'months': 'months',
			'a_while_ago': 'a while',
			'ago': ' ago'
		},
        'KikinVideo':{
            'btnSave': 'Watch Later',
			'btnSaved': 'Watch here!',
            'btnSaving': 'Saving...',
            'like': 'Like',
			'errorDlgTitle': 'We were unable to save your video :-(',
			'errorDlgMsg': 'To save videos on kikin Video you need to login with Facebook.',
            'errorDlgLikeTitle': 'We were unable to like your video :-(',
			'errorDlgLikeMsg': 'To like videos on kikin Video you need to login with Facebook.',
            'errorDlgUnlikeTitle': 'We were unable to unlike your video :-(',
			'errorDlgUnlikeMsg': 'To unlike videos on kikin Video you need to login with Facebook.'
		}
    },

    DEFAULT_LOCALE: 'en-US',

    get : function(type, name) {
        try {
            var locale = navigator.language;
            if (this[locale]) {
                return $cwc.Locale[locale][type][name];
            } else {
                return $cwc.Locale['en-US'][type][name];
            }
        } catch (err) { return ''; }
    }
}, {});
