/** @module listener */

var browser = require('./browser');
var counter = require('./counter');
var utils = require('./utils');

/**
 * Bind event listeners to application events.
 * @param {!module:models/User} user
 * @param {!module:models/NoteCollection} notes
 * @param {!module:Synchronizer} synchronizer
 * @param {!Promise} started Indicates whether the application is ready.
 */
module.exports.listen = function(user, notes, synchronizer, started) {

    /**
     * Respond to note-add/change events: set the badge text to the number of
     * notes that match the active tab's url.
     * @param {!module:models/Note} note
     */
    var handleNoteChanged = function(note) {
        var callback = function(tab) {
            var count = counter.countNote(tab, note);
            var text = count ? count.toString() : '';

            browser.setBadgeText(tab, text);
        };

        browser.getCurrentTab(callback);
    };

    /**
     * Respond to notes-reset events: set the badge text to the number of notes
     * that match the active tab's url.
     * @param {!module:models/NoteCollection} notes
     */
    var handleNotesReset = function(notes) {
        var callback = function(tab) {
            var count = counter.countNotes(tab, notes);
            var text = count ? count.toString() : '';

            browser.setBadgeText(tab, text);
        };

        browser.getCurrentTab(callback);
    };

    /**
     * Respond to extension-installed events: navigate to the welcome page.
     */
    var handleInstalled = function() {
        started.always(notes.createWelcomeNotes.bind(notes));
        browser.openTab(utils.welcome_url);
    };

    /**
     * Respond to tab-updated events, and either:
     *
     * a) If the tab's URL is a Social Login callback, then fetch a new User,
     *    syncModified all of the notes, and then navigate to the options page.
     *
     * b) Otherwise, reset the note counter for the active tab..
     * @param {!Object} tab
     */
    var handleTabUpdated = function(tab) {
        if (utils.isSocialCallbackUrl(tab.url)) {
            user.fetch().always(function() {
                synchronizer.syncAll();
                browser.navigateToOptions(tab);
            });
        } else {
            handleNotesReset(notes);
        }
    };

    notes.on('add', handleNoteChanged);
    notes.on('change', handleNoteChanged);
    notes.on('reset', handleNotesReset);

    browser.onInstalled(handleInstalled);
    browser.onTabUpdated(handleTabUpdated);
};