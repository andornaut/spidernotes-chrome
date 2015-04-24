/** @module views/popup/CurrentList */

var _ = require('underscore');
var BaseList = require('./BaseList');
var storage = require('../../storage');
var template = require('../../../templates/popup/current.hbs');

const MAXIMIZED_CLASS = 'maximized';
const MAXIMIZED_ICON_CLASS = 'fa-chevron-left';
const SPLIT_CLASS = 'split';
const SPLIT_ICON_CLASS = 'fa-chevron-right';

/**
 * Renders a list of notes that are filtered by the web-address of the active
 * tab.
 * @constructor
 * @augments module:views/popup/BaseList
 */
module.exports = BaseList.extend(/** @lends module:views/popup/CurrentList# */ {
    /**
     * Attributes that will be set as view root DOM element attributes.
     * @type {!object}
     */
    attributes: function() {
        return {
            'class': storage.isSearchMaximized ? MAXIMIZED_CLASS : SPLIT_CLASS
        };
    },

    /**
     * Handlebars template function.
     * @type {!function}
     */
    template: template,

    events: function() {
        return _.extend({}, {
            'click A.toggle-maximize': 'toggleMaximize',
            'click ARTICLE SPAN': 'searchTag'
        }, BaseList.prototype.events);
    },

    serialize: function() {
        var context = BaseList.prototype.serialize.call(this);

        context.toggleIconClass = storage.isSearchMaximized ?
            MAXIMIZED_ICON_CLASS : SPLIT_ICON_CLASS;
        return context;
    },

    /**
     * Filter the list of notes in the SearchListView by a given tag.
     * @param {!Event} event
     */
    searchTag: function(event) {
        this.searchListView.searchTag(event);
    },

    toggleMaximize: function(event) {
        var icon = event.currentTarget.firstElementChild;

        event.preventDefault();
        event.stopImmediatePropagation();

        icon.classList.toggle(MAXIMIZED_ICON_CLASS);
        icon.classList.toggle(SPLIT_ICON_CLASS);
        this.$el.toggleClass(MAXIMIZED_CLASS + ' ' + SPLIT_CLASS);
        storage.isSearchMaximized = !storage.isSearchMaximized;
    }
});