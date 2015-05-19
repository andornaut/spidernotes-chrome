/**
 * This module is the entry point into the application, It exports the
 * functions that are used to render the options and popup pages.
 * @module app
 */

// Importing LayoutManager first works around a couple of issues related to
// import order.
require('backbone.layoutmanager');

var $ = require('jquery');
var NoteCollection = require('./models/NoteCollection');
var Synchronizer = require('./Synchronizer');
var User = require('./models/User');
var browser = require('./browser');
var listener = require('./listener');
var options = require('./layouts/options');
var popup = require('./layouts/popup');
var utils = require('./utils');

/**
 * @alias module:app
 */
var app = {

    /**
     * Fetch the User and NoteCollection, and then set a promise. The options
     * and popup layouts must wait for this promise to be resolved before
     * rendering.
     * @protected
     */
    start: function() {
        var notes = new NoteCollection();
        var synchronizer = new Synchronizer(notes);
        var user = new User();
        var is_synchronized = synchronizer.isEnabled();
        var started = is_synchronized ? user.fetch() : user.fetchFromBrowser();
        var getNotes = function() {
            return notes.fetch({ reset: true })
                .done(synchronizer.syncModified.bind(synchronizer));
        };
        /**
         * @type {module:models/NoteCollection}
         */
        this.notes = notes;

        /**
         * @type {module:Synchronizer}
         */
        this.synchronizer = synchronizer;

        /**
         * @type {module:models/User}
         */
        this.user = user;

        /**
         * Indicates whether the application is ready.
         * @type {Promise}
         * @private
         */
        this.started_ = started.then(getNotes, getNotes);

        listener.listen(user, notes, synchronizer, this.started_);

        browser.setBadgeColor('#3366CC');
    },

    /**
     * Start the options page.
     * @param {!Window} window Global object.
     */
    startOptions: function(window) {
        this.started_.always(function() {
            options(window, this);
        }.bind(this));
    },

    /**
     * Start the popup page.
     * @param {!Window} window Global object.
     */
    startPopup: function(window) {
        this.started_.always(function() {
            browser.getCurrentTab(function(tab) {
                popup(window, this, tab ? tab.url : '');
            }.bind(this));

            this.synchronizer.syncPeriodically();
        }.bind(this));
    }
};

module.exports = app;
