/** @module views/options/Preferences */

var Backbone = require('backbone');
var preferences = require('../../preferences');
var template = require('../../../templates/options/preferences.hbs');

/**
 * Renders the preferences section of the options page.
 * @constructor
 * @augments Backbone.View
 * @alias module:views/options/Preferences
 */
module.exports = Backbone.View.extend(/** @lends module:views/options/Preferences# */ {
    events: {
        'change SELECT': 'save'
    },

    /**
     * Handlebars template function.
     * @type {!function}
     */
    template: template,

    /**
     * Save the preferences to the browser storage engine.
     */
    save: function() {
        preferences.editorLines = parseInt(this.$('SELECT[name=editorLines]').val());
        preferences.searchLines = parseInt(this.$('SELECT[name=searchLines]').val());
    },

    /**
     * Return a template context object.
     * @return {!Object}
     */
    serialize: function() {
        return preferences;
    }
});