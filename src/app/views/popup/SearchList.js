/** @module views/popup/SearchList */

var _ = require('underscore');
var BaseList = require('./BaseList');
var template = require('../../../templates/popup/search.hbs');

/**
 * Renders a list of notes that are filtered by the current search query.
 * @constructor
 * @augments module:views/popup/BaseList
 */
module.exports = BaseList.extend(/** @lends module:views/popup/SearchList# */ {
    events: function() {
        return _.extend({}, BaseList.prototype.events, {
            'submit FORM': 'search',
            'click ARTICLE SPAN': 'searchTag',
            'click BUTTON[name=search]': 'search',
            'click FORM I.fa-times': 'clearSearch'
        });
    },

    /**
     * Handlebars template function.
     * @type {!function}
     */
    template: template,

    /**
     * Clear the search field.
     */
    clearSearch: function() {
        this.$('INPUT').val('');
        this.search_('');
    },

    /**
     * Filter the list of notes by the value of the search field.
     * @param {!Event} event
     */
    search: function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.search_(this.$('INPUT').val());
    },

    /**
     * Filter the list of notes by the tag in the element that triggered the
     * supplied event.
     * @param {!Event} event
     */
    searchTag: function(event) {
        event.preventDefault();
        this.search_(event.currentTarget.innerHTML);
    },

    /**
     * Filter the list of notes by the supplied query.
     * @param {!string} query
     * @private
     */
    search_: function(query) {
        this.changeQuery(query.trim().toLowerCase()).then(function() {
            // Focus the cursor on the last position of the search input.
            var $input = this.$('INPUT');
            var len = $input.val().length;

            $input[0].setSelectionRange(len, len);
        }.bind(this));
    }
});