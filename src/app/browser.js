/**
 * Provides an interface for interacting with the Chrome Extension API.
 * @module browser
 */

const OPTIONS_URL = chrome.extension.getURL('options.html');
const POPOUT_URL = chrome.extension.getURL('popout.html');

module.exports = {
    /**
     * Call the callback function with the currently active tab or null.
     * @param {!function} callback
     */
    getCurrentTab: function(callback) {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(activeTabs) {
            callback(activeTabs.length ? activeTabs[0] : null);
        });
    },

    /**
     * Fetch data from the browser storage engine.
     * @param {!string} key
     * @param {!function} callback
     */
    getData: function(key, callback) {
        chrome.storage.sync.get(key, callback);
    },

    /**
     * Return true if the supplied url matches the POPOUT_URL.
     * @param {!string} url
     * @return {!boolean}
     */
    isPopoutUrl: function(url) {
        return url.indexOf(POPOUT_URL) === 0;
    },

    /**
     * Bind an event handler to be called when this extension is installed or
     * updated.
     * @param {!function} callback
     */
    onInstalled: function(callback) {
        chrome.runtime.onInstalled.addListener(function(details) {
            if (details.reason == 'install') {
                callback();
            }
        });
    },

    /**
     * Bind an event handler to be called when a web browser tab is updated.
     * @param {!function} callback
     */
    onTabUpdated: function(callback) {
        chrome.tabs.onActivated.addListener(function(activeInfo) {
            chrome.tabs.get(activeInfo.tabId, function(tab) {
                if (tab && tab.url) {
                    callback(tab);
                }
            });
        });
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if (changeInfo.status == 'complete' && tab.url) {
                callback(tab);
            }
        });
    },

    /**
     * Open a new web browser tab.
     * @param {!string} url
     */
    openTab: function(url) {
        chrome.tabs.create({ url: url });
    },

    /**
     * Redirect the supplied tab to the options page.
     * @param {!number} tabId
     */
    navigateToOptions: function(tabId) {
        chrome.tabs.update(tabId, { url: OPTIONS_URL });
    },

    /**
     * Set the web browser toolbar icon's badge color.
     * @param {!string} color Hex color code.
     */
    setBadgeColor: function(color) {
        chrome.browserAction.setBadgeBackgroundColor({ color: color });
    },

    /**
     * Set the web browser toolbar icon's badge text.
     * @param {!number} tabId
     * @param {!string} text Hex color code.
     */
    setBadgeText: function(tabId, text) {
        chrome.browserAction.setBadgeText({ tabId: tabId, text: text });
    },

    /**
     * Save data to the browser storage engine.
     * @param {!string} key
     * @param {!Object} data
     */
    setData: function(key, data) {
        var obj = {};

        obj[key] = data;
        chrome.storage.sync.set(obj);
    }
};