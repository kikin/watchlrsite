{
   "background_page": "background.html",
   "content_scripts": [ 
      {
         "js": [ "content_script.js" ],
         "matches": [ "http://*/*", "https://*/*" ],
         "run-at": [ "document_start" ],
	     "all_frames": true
      },
	  {
         "js": [ "kikin_domain.js" ],
         "matches": [ "http://*.kikin.com/*", "https://*.kikin.com/*" ],
         "run-at": [ "document_start" ]
      }
   ],
   "description": "Watch, share, and play any video anywhere",
   "icons": {
      "24": "icon_24.png",
      "48": "icon.png"
   },
   "name": "kikin Video",
   "permissions": [ "tabs",  "http://*/*" , "https://*/*" ],
   "version": "__K_MAJOR_VERSION__.__K_MINOR_VERSION__.__K_BUILD_NUMBER__",
   "update_url": "https://kbp.de.kikin.com/wbp-data/updates/update.xml"
}
