/** @module layout/popup */

var CurrentListView = require('../views/popup/CurrentList');
var EditorView = require('../views/popup/Editor');
var EncryptionView = require('../views/options/Encryption');
var SearchListView = require('../views/popup/SearchList');
var browser = require('../browser');
var layout = require('./');
var storage = require('../storage');
var template = require('../../templates/popup/popup.hbs');
var utils = require('../utils');

/**
 * Initialize and render the popup layout.
 * @param {!Window} window Global object.
 * @param {!Object} app
 * @param {!string} tabUrl URL of the web browser's active tab.
 */
module.exports = function(window, app, tabUrl) {
    var initialFirstModified = storage.firstModified;
    var isPopout = browser.isPopoutUrl(window.location.href);
    var notes = app.notes;
    var query = utils.getHostname(tabUrl);
    var synchronizer = app.synchronizer;
    var editView = new EditorView({
        collection: notes,
        isPopout: isPopout,
        tabUrl: tabUrl,
        window: window
    });
    var encryptionView = new EncryptionView({
        notes: notes,
        synchronizer: synchronizer
    });
    var searchListView = new SearchListView({
        collection: notes,
        isPopout: isPopout
    });
    var unloadCallback;
    var views;


    // Toggle the EncryptionView, when the EditorView's encryption icon is
    // clicked.
    editView.$el.on('click', '.encryption-toggle', function(event) {
        event.preventDefault();
        encryptionView.$el.toggle();
        editView.updateEncryptionIcon();
    });
    encryptionView.$el.on('click', '.close', function(event) {
        event.preventDefault();
        editView.updateEncryptionIcon();
    });

    views = {
        '#edit': editView,
        '#encryption': encryptionView,
        '#search': searchListView
    };

    if (!isPopout) {
        views['#current'] = new CurrentListView({
            collection: notes,
            isPopout: isPopout,
            query: query,
            searchListView: searchListView
        });
    }

    // Synchronize when the EditorView is unloaded if one or more notes were
    // changed.
    unloadCallback = function() {
        editView.saveState();
        if (storage.firstModified > initialFirstModified) {
            synchronizer.syncModified();
        }
    };
    layout(window, template, views, unloadCallback);
};