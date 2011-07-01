/**
 * @file
 * JavaScript section of the kikin plugin.
 */
 
if (!com) {
    var com = {};
}

if (!com.kikinVideo) {
    com.kikinVideo = {};
}

com.kikinVideo.plugin = function() {
    var pub = {};
    var priv = {};
    const Ci = Components.interfaces;
    const Cc = Components.classes;
    
    priv.KIKIN_VIDEO_FIREFOX_PLUGIN_UUID = "{3C108598-D93F-4606-A3C3-2873B8017A60}";
    pub.browserVersion = null;
    priv.xhr = null;
    priv.jsUrl = "";
    
    // Not using JS console service right now
    priv.jsConsoleService = Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService);
    
    /** Log messages to firefox command line console if enabled. */
    pub.logMessage = function(aCategory, aMessage) {
        // Display message, TODO, get N arguments and print them 
        // in separate lines, handle arrays and objects properly
        dump("kikin (" + aCategory + "): " + aMessage + "\n");
        
        // We are not using the JS console
        priv.jsConsoleService.logStringMessage("kikin " + aCategory + ": " + aMessage);
    };
    
    /** Log messages to firefox command line console if enabled. */
    pub.logError = function(aMessage) {
        pub.logMessage("ERROR", aMessage);
    };
    
    /** Log messages to firefox command line console if enabled. */
    pub.logWarning = function(aMessage) {
        pub.logMessage("WARNING", aMessage);
    };
    
    /** Log messages to firefox command line console if enabled. */
    pub.logInfo = function(aMessage) {
        pub.logMessage("INFO", aMessage);
    };
    
    /** Log messages to firefox command line console if enabled. */
    pub.logDebug = function(aMessage) {
        pub.logMessage("DEBUG", aMessage);
    };
    
    /** Retrieves the browser version string. */
    pub.getBrowserVersion = function() {
        var appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
        return (appInfo) ? appInfo.version : "";
    };
    
    /** 
      * NOTE: Make sure this function is called when kikin runs first time in the browser
      *       and we want to open the welcome page.
      *
      * Processes kikin tabs in the restoring window.
      * If welcome page is not opened yet, open the welcome page in the first kikin.com tab
      * and close all other kikin.com tabs. Else close all kikin.com tabs in the window.
      */
    priv.processKikinTabs = function(windowStateObj, shouldOpenWelcomePage, welcomePageURL) {
        try {
            var ss = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);
            
            // Check if we should open welcome page.
            pub.logInfo("Should open welcome page: " + shouldOpenWelcomePage);
            
            var windowObj = windowStateObj.windows[0];
            var numberOfTabs = windowObj.tabs.length;

            var tabStateObj = null;
            var restoringURL = null;

            // Close all kikin.com tabs unless kikin.com tab is first one
            // In general tab state object should be valid but when tab URL
            // is a download URL (or an XPI URL) the tab state seems to 
            // contain no entries, hence the try/catch inside the loop.
            for (var j = numberOfTabs - 1; j >= 1; j--) {
                try {
                    // Get URL which is going to open
                    tabStateObj = windowObj.tabs[j];
                    restoringURL = tabStateObj.entries[tabStateObj.index - 1].url;

                    if (restoringURL.indexOf("video.kikin.com") != -1) {
                        gBrowser.removeTab(gBrowser.tabContainer.childNodes[j]);
                        windowObj.tabs.splice(j, 1);
                        --numberOfTabs;
                    }
                } catch (ex) {
                    pub.logWarning("Error while processing tab " + j + ", continuing to next tab. Error details: " + ex);
                }
            }

            // If first tab is kikin.com we reuse it for the welcome page
            // or close it, depending on whether we should open welcome page. 
            // If first tab is not kikin.com we know we have closed all 
            // kikin.com tabs int he loop above, so open a new tab for the 
            // welcome page if the welcome page should open
            tabStateObj = windowObj.tabs[0];
            restoringURL = null;
            try {
                restoringURL = tabStateObj.entries[tabStateObj.index - 1].url;
            } catch (ex) {
                pub.logWarning("Error while processing tab 0, continuing to next tab. Error details: " + ex);
            }
            if ((restoringURL !== null) && (restoringURL.indexOf("video.kikin.com") != -1)) {
                if (shouldOpenWelcomePage) {
                    // Reuse tab to open welcome page
                    gBrowser.browsers[0].loadURI(welcomePageURL, null, null);
                    tabStateObj.entries[tabStateObj.index - 1].url = welcomePageURL;
                    tabStateObj.selected = 1;
                    shouldOpenWelcomePage = false;
                    window.focus();
                } else {
                    gBrowser.removeTab(gBrowser.tabContainer.childNodes[0]);
                    windowObj.tabs.splice(0, 1);
                    --numberOfTabs;
                }
            }

            // If we have closed all the tabs of window, 
            // close the window aslo.
            if (numberOfTabs === 0) {
                windowStateObj.windows.splice(0, 1);
                window.close();
            }

            // Set the window state 
            try {
                pub.logInfo("Changing Browser state.");
                ss.setWindowState(window, JSON.stringify(windowStateObj), true);
                pub.logInfo("Browser state changed successfully.");
            }
            catch (exc) {
                pub.logError("Could not change kikin domain URL to kikin welcome page URL. Error details: " + exc);
            }

            // If we hadn't opened the welcome page yet, 
            // open the welcome page in new tab.
            if (shouldOpenWelcomePage) {
                gBrowser.selectedTab = gBrowser.addTab(welcomePageURL);
                window.focus();
            }
        } catch (err) {
            pub.logError(err);
        }
    };
    
    /** 
    * Called to open the welcome page. 
    *
    * If Firefox restarts, or if user sets restore tabs preference,
    * Firefox will send restoring events for all tabs and windows.
    * When Firefox is not going to restore tabs, we trigger the "welcome experience"
    * by calling this function the first time a page is loaded (first OnDOMContentLoaded).
    *
    * Called from SSTabRestoring: We ask the plugin whether to open the welcome page 
    *                             (only one restoring event across all windows should 
    *                             open it).
    */
    priv.onTabsRestoring = function(aEvent) {
        try {   
                     
            if (priv.shouldProcessTabsRestoring) {
                // We only need to process the first event
                document.removeEventListener("SSTabRestoring", priv.onTabsRestoring, false);
                document.removeEventListener("SSTabRestored", priv.onTabsRestored, false);
                
                // Get window state
                var ss = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);
                var win = window;
                if (window.docShell instanceof Ci.nsIInterfaceRequestor) {
                    win = window.docShell.getInterface(nsIDOMWindow);
                }
                try {
                    var windowStateObj = JSON.parse(ss.getWindowState(win));
                    // TODO: Enable this line for opening welcome page
                    // priv.processKikinTabs(windowStateObj, priv.kikinObj.shouldOpenWelcomePage());
                } catch (windowStateObjectErr) {
                    
                    // If there is an error while retrieving or parsing window state
                    // object, try again.                
                    pub.logError(windowStateObjectErr);
                    setTimeout(priv.onTabsRestoring(aEvent), 500);
                }               
                
                priv.shouldProcessTabsRestoring = false;
            }
        } catch (e) { pub.logError(e); }
    };
    
    /** 
    * Bacckup case for opening the welcome page.  
    *
    * If Firefox restarts, or if user sets restore tabs preference,
    * Firefox will send restoring events for all tabs and windows.
    * When Firefox is not going to restore tabs, we trigger the "welcome experience"
    * by calling this function the first time a page is loaded (first OnDOMContentLoaded).
    *
    * Called from SSTabRestored: We ask the plugin whether to open the welcome page 
    *                             (only one restoring event across all windows should 
    *                             open it).
    */
    priv.onTabsRestored = function(aEvent) {
        try {
            // We only need to process the first event
            document.removeEventListener("SSTabRestoring", priv.onTabsRestoring, false);
            document.removeEventListener("SSTabRestored", priv.onTabsRestored, false);
            
            pub.logDebug("anEvent object value: " + aEvent);
            if (priv.shouldProcessTabsRestoring) {            
                // Get window state
                var ss = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);
                var win = window;
                if (window.docShell instanceof Ci.nsIInterfaceRequestor) {
                    win = window.docShell.getInterface(nsIDOMWindow);
                }
                try {
                    var windowStateObj = JSON.parse(ss.getWindowState(win));
                    // TODO: enable this line for opening welcome page
                    // priv.processKikinTabs(windowStateObj, ((aEvent === null) ? true : priv.kikinObj.shouldOpenWelcomePage()));
                } catch (windowStateObjectErr) {                    
                    pub.logError(windowStateObjectErr);                    
                }
                
                priv.shouldProcessTabsRestoring = false;
            }
        } catch (e) { pub.logError(e); }
    };

    pub.register = function() {
        try {
        
            // priv.shouldProcessTabsRestoring = true;
                
            // pub.logInfo("Performing first time actions");
            // document.addEventListener("SSTabRestoring", priv.onTabsRestoring, false);
            // document.addEventListener("SSTabRestored", priv.onTabsRestored, false);
            

            // Register for extension-disabled, extension-enabled and extension-uninstalled events
            // priv.extensionManagerObserver.register();

            // Listen to DOMContentLoaded event for all windows of all tabs (including frames)
            var appcontent = gBrowser.parentNode;
            appcontent.addEventListener("DOMContentLoaded", priv.onDOMContentLoaded, false);
            appcontent.addEventListener("DOMTitleChanged", priv.onDOMTitleChanged, false);

            // Get the kikin video JS URL
            priv.getKikinVideoJsUrl();

            pub.logInfo("Plugin registered successfully.");
        }
        catch (err) {
            pub.logError("Error registering for events. Error details: " + err);

            // TODO, we should un-register and remove plugin at this point.
        }
    };

    pub.unregister = function() {
        try {

            // document.removeEventListener("SSTabRestoring", priv.onTabsRestoring, false);
            // document.removeEventListener("SSTabRestored", priv.onTabsRestored, false);

            // We don't want to listen to extension-disable, enable or uninstall notifications anymore
            // priv.extensionManagerObserver.unregister();

            // We don't want to listen to DOMContentLoaded on xul:tabbrowser anymore
            var appcontent = gBrowser.parentNode;
            if (appcontent) {
                appcontent.removeEventListener("DOMContentLoaded", priv.onDOMContentLoaded, false);
                appcontent.removeEventListener("DOMTitleChanged", priv.onDOMTitleChanged, false);
            }
        }
        catch (err) {
            pub.logError("Error unregistering from events. Error details: " + e);
        }
        finally {
            priv.kikinObj = null;
        }
    };

    /** Tracks enabling/disabling of this extension. */
    priv.extensionManagerObserver =
    {
        /** Type of requested actions. */
        ACTION_UNINSTALL : 0,
        ACTION_DISABLE : 1,
        ACTION_UNKNOWN : 2,
        
        /** Last Extension manager action. */
        lastRequestedAction: this.ACTION_UNKNOWN,

        /** Called to observe a topic. */
        observe: function(subject, topic, data) {
            // Topic is to modify request
            if (topic == "em-action-requested") {

                // Get name of update item to check it is our extension the one the event is about
                subject.QueryInterface(Ci.nsIUpdateItem);
                if (priv.KIKIN_VIDEO_FIREFOX_PLUGIN_UUID == subject.id) {

                    var requestedAction = data;

                    // If the action is to cancel then cancel the last thing we did
                    if ((requestedAction == "item-cancel-action") && this.lastRequestedAction) {

                        switch (this.lastRequestedAction) {
                            case this.ACTION_UNINSTALL:
                                // priv.kikinObj.onUninstallCancelled();
                                break;
                            case this.ACTION_DISABLE:
                                // priv.kikinObj.onDisableCancelled();
                                break;
                            default:
                                break;
                        }

                        // User has cancelled one of the actions we are tracking, notify the server
                        this.lastRequestedAction = this.ACTION_UNKNOWN;
                    } else {

                        // Process action                                     
                        // If the action is supported, record the action so we can cancel it
                        // and process it.
                        switch (requestedAction) {
                            case "item-uninstalled":
                                this.lastRequestedAction = this.ACTION_UNINSTALL;
                                /*if (priv.kikinObj.onUninstallTriggered()) {
                                    gBrowser.selectedTab = gBrowser.addTab(priv.kikinObj.getGoodbyePageUrl());
                                }*/
                                break;
                            case "item-disabled":
                                this.lastRequestedAction = this.ACTION_DISABLE;
                                /*if (priv.kikinObj.onDisableTriggered()) {
                                    gBrowser.selectedTab = gBrowser.addTab(priv.kikinObj.getGoodbyePageUrl());
                                }*/
                                break;
                            default:
                                // User did something we don't care about
                                this.lastRequestedAction = this.ACTION_UNKNOWN;
                                break;
                        }
                    }
                }
            }
        },
        
        onUninstalling: function(addon) {  
            if (addon.id == priv.KIKIN_VIDEO_FIREFOX_PLUGIN_UUID) {  
                this.lastRequestedAction = this.ACTION_UNINSTALL;
                /*if (priv.kikinObj.onUninstallTriggered()) {
                    gBrowser.selectedTab = gBrowser.addTab(priv.kikinObj.getGoodbyePageUrl());
                }*/
            }  
        },  
        
        onDisabling: function(addon) {  
            if (addon.id == priv.KIKIN_VIDEO_FIREFOX_PLUGIN_UUID) {  
                this.lastRequestedAction = this.ACTION_DISABLE;
                /*if (priv.kikinObj.onDisableTriggered()) {
                    gBrowser.selectedTab = gBrowser.addTab(priv.kikinObj.getGoodbyePageUrl());
                }*/
            }
        },
        
        onOperationCancelled: function(addon) {  
            if (addon.id == priv.KIKIN_VIDEO_FIREFOX_PLUGIN_UUID) {  
                if((addon.pendingOperations & AddonManager.PENDING_UNINSTALL) == AddonManager.PENDING_UNINSTALL) {
                    // priv.kikinObj.onUninstallCancelled();
                } else if((addon.pendingOperations & AddonManager.PENDING_DISABLE) == AddonManager.PENDING_DISABLE) {
                    // priv.kikinObj.onDisableCancelled();
                }
                                
                this.lastRequestedAction = this.ACTION_UNKNOWN;
            }  
        },

        /** Retrieves observer service. Standard implementation of this required method of observers. */
        get observerService() {
            return Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
        },

        /** Register observer. Required method of observers. */
        register: function() {
            var versionChecker = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator);
            if (versionChecker.compare(pub.browserVersion, "4.0b7") >= 0) {
                try {  
                    Components.utils.import("resource://gre/modules/AddonManager.jsm");  
                    AddonManager.addAddonListener(this);
                } catch (ex) {
                    pub.logError(ex);
                }
            } else {
                // Register for both topics this observer handles
                this.observerService.addObserver(this, "em-action-requested", false);
            }
        },

        /** Unregister observer. Required method of observers. */
        unregister: function() {
            // Unregister for both topics this observer handles
            var versionChecker = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator);
            if (versionChecker.compare(pub.browserVersion, "4.0b7") < 0) {
                this.observerService.removeObserver(this, "em-action-requested");
            }
        }
    };

    /** Injects kikin video JS on the page. */
    priv.injectKikinVideoJs = function(pageWindow) {
        try {
            pub.logInfo('Injecting javascript in window:' + pageWindow + ' from: ' + priv.jsUrl);
            if (pageWindow && priv.jsUrl) {

                // create the script tag on the page 
                // and load the kikin video JS.
                var script = pageWindow.document.createElement('script');
                script.src = priv.jsUrl;
                pageWindow.document.body.appendChild(script);
            }
        } catch (err) {
            pub.logError("Error while JS in page. Reason:" + err);
        }
    };

    /** Called when a document has loaded but not all images are loaded nor all scripts may have executed. */
    priv.onDOMContentLoaded = function(anEvent) {
        try {
            // We only care about documents. Event target should always be a document because event is DOMContentLoaded but check just in case
            var triggerWindow = null;
            if (anEvent.originalTarget.nodeName == "#document") {
                
                // If we have not opened the welcom page yet and it is the first time we are running kikin
                // we should open welcome page.
                // pub.logDebug("Should process tabs restoring: " + priv.shouldProcessTabsRestoring);
                /*if (priv.shouldProcessTabsRestoring) {
                    // Check if we have already opened the welcome page 
                    if (priv.kikinObj.shouldOpenWelcomePage()) {
                        priv.onTabsRestored(null);
                    }
                    
                    // If we have already opened the welcome page 
                    // reset the variable.
                    priv.shouldProcessTabsRestoring = false;
                }*/
                triggerWindow = anEvent.originalTarget.defaultView;
                
            } else if (anEvent.originalTarget.nodeName == "IFRAME") {
                triggerWindow = anEvent.originalTarget.contentWindow;
            }

            if (triggerWindow) {

                pub.logInfo("OnDOMContentloaded for browser window:" + triggerWindow);
                priv.injectKikinVideoJs(triggerWindow);
            }
        }
        catch (e) {
            // Report error
            pub.logError("Error in onDOMContentLoaded. \n" + e);
        }
    };

    priv.onDOMTitleChanged = function(anEvent) {
        try {
            // We only care about documents. Event target should always be a document because event is DOMTitleChanged but check just in case
            if (anEvent.originalTarget.nodeName == "#document") {
                
                var triggerWindow = anEvent.originalTarget.defaultView;

                // Execute JS only if we received event for
                // main browser window's top frame.

                // Figure out which tab this window belongs to.                
                /*for (var i = 0; i < gBrowser.browsers.length; ++i) {

                    // Browser inside tab
                    var browser = gBrowser.browsers[i];

                    // Figure out if the DOMContentLoaded event was for this browser
                    // or for the corresponding bar browser
                    if (browser.contentWindow === triggerWindow.top) {
                        var url = anEvent.originalTarget.URL;
                        pub.logInfo("onDomTitleChanged for URL:" + url);
                        priv.kikinObj.onDomTitleChanged(url, triggerWindow);
                        break;
                    }
                }*/
            }
        }
        catch (e) {
            // Report error
            pub.logError("Error in onDOMTitleLoaded. \n" + e);
        }
    };

    /** Called when user clicks the kikin menu item in the browser UI. Takes user to kikin page. */
    pub.showOptions = function() {
        try {
            // KIKIN_PROPRIETARY_BEGIN()
            // window._content.self.location.href = 'http://www.kikin.com/tools';
            // KIKIN_PROPRIETARY_END()
        }
        catch (err) {
            // Report error
            pub.logError("Error going to kikin page on menu item click. Error details: " + err);

            // We don't want to be silent in this case since the user took an action
            alert(err);
        }
    };

    /* Called when we state changes for the request. */
    priv.onRequestReadyStateChange = function() {
        try {
            pub.logDebug('Response text:' + priv.xhr.responseText + " and data type of response text: " + (typeof priv.xhr.responseText))
            // parse the response when ready state is 4 and response text is valid
            if (priv.xhr.readyState && priv.xhr.readyState == 4 && priv.xhr.responseText && (typeof priv.xhr.responseText == 'string')) {
                var jsonObject = JSON.parse(priv.xhr.responseText);
                
                // set the kikin video JS URL if response JSO is valid
                if (jsonObject && jsonObject.js_url && (typeof jsonObject.js_url == 'string')) {
                    priv.jsUrl = jsonObject.js_url;
                    pub.logInfo('js url:' + priv.jsUrl);
                }
            }
        } catch (err) {
            pub.logDebug('Error while parsing JSON response. Reason:\n' + err);
        }
    }

    /** Fetches the kikin video JS URL. */
    priv.getKikinVideoJsUrl = function() {
        pub.logDebug('Sending request for fetching js url.');
        priv.xhr = new XMLHttpRequest();
        priv.xhr.onreadystatechange = priv.onRequestReadyStateChange;
        priv.xhr.open('GET', 'http://www.watchlr.com/static/html/jsloc.json');
        priv.xhr.send();
        pub.logDebug('Request sent for fetching js url.');

        // Retry after a day if user has not closed the browser.
        setTimeout(priv.getKikinVideoJsUrl, 24 * 60 * 60 * 1000);
    };

    return pub;
} ();

// Try to create the bridge to the C++ side of the plugin. If successful, 
// add ourselves as handlers for HTTP events and stuff like that. Otherwise,
// we remain silent. This way we avoid initialization errors at runtime
try {
    // Retrieve browser version
    var kikinVideoPlugin = com.kikinVideo.plugin;
    kikinVideoPlugin.browserVersion = kikinVideoPlugin.getBrowserVersion();
    kikinVideoPlugin.logInfo("Loading plugin into Firefox " + kikinVideoPlugin.browserVersion);
    
    // Listen to load and unload events to register our listeners and observers
    window.addEventListener("load", kikinVideoPlugin.register, false);
    window.addEventListener("unload", kikinVideoPlugin.unregister, false);        
}
catch (err) 
{
    // Error initializing
    kikinVideoPlugin.logError("Error initializing kikin plugin. Error details: " + err);
}
