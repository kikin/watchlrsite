/**
 * User: kapilgoel
 * Date: 6/23/11
 * Time: 4:44 PM
 */

if (!com.watchlr) {
    com.watchlr = {};
}

if (!com.watchlr.system) {
    com.watchlr.system = {};
}

if (!com.watchlr.config) {
    com.watchlr.config = {};
}

if (!com.watchlr.util) {
    com.watchlr.util = {};
}

if (!com.watchlr.hosts) {
    com.watchlr.hosts = {};
}

if (!com.watchlr.hosts.adapters) {
    com.watchlr.hosts.adapters = {};
}

if (!com.watchlr.hosts.defaultEngine) {
    com.watchlr.hosts.defaultEngine = {};
}

if (!com.watchlr.hosts.bing) {
    com.watchlr.hosts.bing = {};
}

if (!com.watchlr.hosts.cbsnews) {
    com.watchlr.hosts.cbsnews = {};
}

if (!com.watchlr.hosts.cnn) {
    com.watchlr.hosts.cnn = {};
}

if (!com.watchlr.hosts.espn) {
    com.watchlr.hosts.espn = {};
}

if (!com.watchlr.hosts.facebook) {
    com.watchlr.hosts.facebook = {};
}

if (!com.watchlr.hosts.google) {
    com.watchlr.hosts.google = {};
}

if (!com.watchlr.hosts.orkut) {
    com.watchlr.hosts.orkut = {};
}

if (!com.watchlr.hosts.vimeo) {
    com.watchlr.hosts.vimeo = {};
}

if (!com.watchlr.hosts.watchlr) {
    com.watchlr.hosts.watchlr = {};
}

if (!com.watchlr.hosts.yahoo) {
    com.watchlr.hosts.yahoo = {};
}

if (!com.watchlr.hosts.youtube) {
    com.watchlr.hosts.youtube = {};
}

if (!com.watchlr.ui) {
    com.watchlr.ui = {};
}

if (!com.watchlr.modalwin) {
    com.watchlr.modalwin = {};
}

var $cws    = com.watchlr.system,
   //  $cwsr   = $cws.runtime,
    $cwc    = com.watchlr.config,
    $cwutil = com.watchlr.util,
    $cwf    = com.watchlr.features,
    $cwa    = com.watchlr.analytics,
    $cwui   = com.watchlr.ui,
    // $cwuiw  = com.watchlr.ui.widgets,
    $cwe    = com.watchlr.error,
    $cwm    = com.watchlr.monetization,
    $cwh    = com.watchlr.hosts,
    // these below are defined in the Bootstraps
    $cwss   = undefined, // $ks.services
    // these are defined in their declarations
    $cwat   = undefined;
