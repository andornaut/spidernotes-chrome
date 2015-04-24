/** @module layout/options */

var BackupView = require('../views/options/Backup');
var EncryptionView = require('../views/options/Encryption');
var PreferencesView = require('../views/options/Preferences');
var SynchronizationView = require('../views/options/Synchronization');
var layout = require('./');
var template = require('../../templates/options/options.hbs');

/**
 * Initialize and render the options layout.
 * @param {!Window} window Global object.
 * @param {!Object} app
 * @alias module:layout/options
 */
var options = function(window, app) {
    var views = {
        '#backup': new BackupView(app),
        '#encryption': new EncryptionView(app),
        '#preferences': new PreferencesView(app),
        '#synchronization': new SynchronizationView(app)
    };

    layout(window, template, views);
};

module.exports = options;