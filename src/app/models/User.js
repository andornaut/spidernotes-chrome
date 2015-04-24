/** @module models/User */

var $ = require('jquery');
var Backbone = require('backbone');
var browser = require('../browser');
var server = require('../server');
var utils = require('../utils');

/**
 * @constructor
 * @augments Backbone.Model
 */
module.exports = Backbone.Model.extend(/** @lends module:models/User# */ {

    /**
     * Default user attributes.
     * @type {!Object}
     */
    defaults: {
        isConnected: false,
        email: '',
        name: '',
        provider: '',
        token: ''
    },

    /**
     * The name of the attribute which represents the user's unique identifier.
     * @type {!string}
     */
    idAttribute: 'token',

    initialize: function() {
        this.on('change', this.change, this);
        server.setUser(this);
    },

    /**
     * Disconnect the user's Social Login account.
     * @return {!Promise}
     */
    disconnect: function() {
        var promise = server.disconnectUser();
        var throwException = function() {
            throw 'Disconnect failed';
        };
        var updateUser = function(response) {
            this.set(this.parse(response));
        }.bind(this);

        promise.done(updateUser).fail(throwException);
        return promise;
    },

    /**
     * Save the user's data to browser storage.
     */
    change: function() {
        // Never sync an empty token, because that would disconnect other
        // installations.
        if (this.get('token')) {
            // TODO: should be saving to localStorage if not synchronized.
            browser.setData('user', this.toJSON());
        }
    },

    /**
     * Fetch the user's attributes from the server and from the web browser.
     * @return {!Promise}
     */
    fetch: function() {
        var fetchFromServer = function() {
            return server.getUser().done(function(data) {
                this.set(data);
            }.bind(this));
        }.bind(this);

        return this.fetchFromBrowser().then(fetchFromServer).promise();
    },

    /**
     * Fetch the user's attributes from the web browser.
     * @return {!Promise}
     */
    fetchFromBrowser: function() {
        var dfd = $.Deferred();

        browser.getData('user', function(items) {
            if (items.user) {
                // Do not trigger a change event, because that would cause the
                // user to be fetched again.
                this.set(items.user, { silent: true });
            }
            dfd.resolve();
        }.bind(this));

        return dfd.promise();
    },

    /**
     * Delete the user.
     * @return {!Promise}
     */
    remove: function() {
        var promise = server.deleteUser();

        promise.always(function() {
            this.set(this.defaults);
        }.bind(this));

        return promise;
    }
});