/** @module views/popup/Item */

var Backbone = require('backbone');
var template = require('../../../templates/popup/item.hbs');
var utils = require('../../utils');

/**
 * Renders a single note for the note list views.
 * @constructor
 * @augments Backbone.View
 */
module.exports = Backbone.View.extend(/** @lends module:views/popup/Item# */ {

    /**
     * Attributes that will be set as view root DOM element attributes.
     * @type {!object}
     */
    attributes: function() {
        return { 'data-id': this.model.id };
    },

    /**
     * HTML tag name of this view's root element.
     * @type {!string}
     */
    tagName: 'ARTICLE',

    /**
     * If True, then display an "Undo delete" button.
     * @type {!boolean}
     */
    toDelete: false,

    /**
     * Handlebars template function.
     * @type {!function}
     */
    template: template,

    initialize: function(options) {

        /**
         * Height of the item ARTICLE element.
         * @type {!number}
         * @private
         */
        this.height_ = options.height;
        this.listenTo(this.model, "change", this.render);
    },

    /**
     * Show the resize control if the note body overflows its container.
     */
    afterRender: function() {
        var pre = this.$('PRE')[0];

        // Compensate for scrollHeight ~2px larger than it should be in
        // Microsoft Windows.
        if (pre && pre.scrollHeight > pre.clientHeight + 2) {
            this.$('.resize').show();
        }
    },

    /**
     * Return a template context object.
     * @return {!Object}
     */
    serialize: function() {
        var context = this.model.toJSON();
        var words;
        var url;
        var urlHuman;

        context.height = this.height_;
        context.isDeleted = this.model.get('isDeleted');

        if (context.url) {
            words = utils.splitUniqueWords(context.url);
            context.urls = [];
            context.tags = [];

            for (var i = 0; i < words.length; i++) {
                url = words[i];
                urlHuman = utils.stripScheme(url);

                // Tags are words that don't begin with a URL scheme.
                if (url == urlHuman) {
                    context.tags.push(utils.stripComma(url));
                } else {
                    context.urls.push({ url: url, urlHuman: urlHuman });
                }
            }
        }
        return context;
    }
});