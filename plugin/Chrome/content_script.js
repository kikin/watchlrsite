// when JS URL is fetched from background.html
function responseCallback(response) {
    if (response && response.url) {
        var script = document.createElement('script');
        script.setAttribute('src', response.url);
        document.body.appendChild(script);
    }
}

// request background.html for the JS URL.
chrome.extension.sendRequest({ "type": "getJsUrl" }, responseCallback);