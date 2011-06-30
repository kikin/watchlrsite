/**
 * @package com.watchlr.config
 */

$.Class.extend("com.watchlr.config.HostsConfig", {
    DEFAULT_URL_THRESHOLD: 7,
	supportedEngines: {
        'defaultEngine': {
            'package': $cwh.defaultEngine
        },
	    'com.cnn': {
		    'package': $cwh.cnn
		},
		'com.watchlr': {
			'package': $cwh.watchlr
		},
		/*'com.bing': {
			'package': $kh.bing,
			bindings: []
		},*/
		'com.youtube': {
			'package': $cwh.youtube
		},
        'com.vimeo': {
			'package': $cwh.vimeo
		},
        'com.go.espn': {
		    'package': $cwh.espn
		},
        'com.foxsports': {
		    'package': $cwh.foxsports
		},
        'com.cbsnews': {
		    'package': $cwh.cbsnews
		},
		'com.facebook': {
			'package': $cwh.facebook
		},
		'br.com.orkut': {
			'package': $cwh.orkut
		},
		'com.orkut': {
			'package': $cwh.orkut
		},
		'com.google': {
			'package': $cwh.google,
			bindings: [
				{
					urlMatch: /video.google./i,
					category: "video",
					threshold: 7
				},
				{
					urlMatch: /search[\w\W]*&oi=video/i,
					category: "video",
					threshold: 7
				},
				{
					urlMatch: /www.myvideo./i,
					category: "video",
					threshold: 7
				},
				{
					urlMatch: /www.clipfish.de/i,
					category: "video",
					threshold: 7
				},
				{
					urlMatch: /www.google.[a-z]*\/products/i,
					category: "product",
					threshold: 7
				},
				{
					urlMatch: /maps.google.[a-z]{2,}\/maps\/place/i,
					category: "location",
					threshold: 7
				},
				{
					urlMatch: /maps.google.[a-z]{2,}\/maps[\w\W]*&oi=local/i,
					category: "location",
					threshold: 7
				},
				{
					urlMatch: /search\?(.)*&tbs=nws/i,
					category: "news",
					threshold: 7
				},
				{
					urlMatch: /search\?(.)*&tbs=shop/i,
					category: "product",
					threshold: 7
				},
				{
					urlMatch: /search\?(.)*&tbs=vid/i,
					category: "video",
					threshold: 7
				},
				{
					urlMatch: /search\?(.)*&tbs=plcs/i,
					category: "location",
					threshold: 7
				},
				{
					urlMatch: /search\?(.)*&tbs=isch/i,
					category: "images",
					threshold: 7
				}
			]
		},
		'com.yahoo': {
			'package': $cwh.yahoo,
			bindings: [
				{
					urlMatch: /news.search.yahoo.[a-z]*\/search\/news/i,
					category: 'news',
					threshold: 7
				},
				{
					urlMatch: /video.search.yahoo.[a-z]*\/search\/video/i,
					category: "video",
					threshold: 7
				},
				{
					urlMatch: /shopping.yahoo.[a-z]*/i,
					category: "product",
					threshold: 7
				},
				{
					urlMatch: /[a-z]*.shopping.com*/i,
					category: "product",
					threshold: 7
				},
				{
					urlMatch: /[a-z]*.ebay.com*/i,
					category: "product",
					threshold: 7
				},
				{
					urlMatch: /local.yahoo.[a-z]*/i,
					category: "location",
					threshold: 7
				},
				{
					urlMatch: /news.yahoo.[a-z]*/i,
					category: "news",
					threshold: 7
				}
			]
		}
	}
}, {});
