/** @module views/options/Synchronization */

var Backbone = require('backbone');
var template = require('../../../templates/options/synchronization.hbs');
var utils = require('../../utils');


/**
 * Renders the synchronization section of the options page.
 * @constructor
 * @augments Backbone.View
 * @alias module:views/options/Synchronization
 */
module.exports = Backbone.View.extend(/** @lends module:views/options/Synchronization# */ {
    events: {
        'click A.disconnect': 'disconnect',
        'click BUTTON[name=disable]': 'disable',
        'click BUTTON[name=enable]': 'enable'
    },

    /**
     * Handlebars template function.
     * @type {!function}
     */
    template: template,

    initialize: function(options) {
        /**
         * @type {!module:models/User}
         * @private
         */
        this.user_ = options.user;

        /**
         * @type {!module:Synchronizer}
         * @private
         */
        this.synchronizer_ = options.synchronizer;
    },

    /**
     * Disable synchronization.
     */
    disable: function() {
        this.synchronizer_.disable();
        this.render();
    },

    /**
     * Disconnect the user's Social Login account.
     * @param {!Event} event
     */
    disconnect: function(event) {
        event.preventDefault();
        this.user_.disconnect().always(this.render.bind(this));
    },

    /**
     * Enable synchronization.
     */
    enable: function() {
        this.synchronizer.enable();
        this.user_.fetch().always(function() {
            this.render();
            this.synchronizer.syncModified();
        }.bind(this));
    },

    /**
     * Return a template context object.
     * @return {!Object}
     */
    serialize: function() {
        var context = this.user_.toJSON();

        context.isSynchronized = this.synchronizer_.isEnabled();
        context.urls = {
            facebook: utils.getUrl('/auth/facebook'),
            google: utils.getUrl('/auth/google'),
            microsoft: utils.getUrl('/auth/windows_live'),
            twitter: utils.getUrl('/auth/twitter'),
            yahoo: utils.getUrl('/auth/openid')
        };
        return context;
    }
});