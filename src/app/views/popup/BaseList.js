/** @module views/popup/BaseList */

var Backbone = require('backbone');
var ItemView = require('./Item');
var browser = require('../../browser');
var preferences = require('../../preferences');
var storage = require('../../storage');

const MAXIMIZE_NOTE_CLASS = 'fa-chevron-up';
const EXPAND_TITLE = 'Expand';
const SHRINK_TITLE = 'Shrink';
const ITEM_HEIGHT_PX = 16;
const PAGE_SIZE = 50;

/**
 * Base implementation of a note list view.
 * @constructor
 * @augments Backbone.View
 */
module.exports = Backbone.View.extend(/** @lends module:views/popup/BaseList# */ {
    events: {
        'click .resize A': 'resize',
        'click A': 'navigate',
        'click BUTTON[name=more]': 'more',
        'click ARTICLE BUTTON': 'undoDelete',
        'click ARTICLE I': 'deleteNote',
        'click PRE': 'edit'
    },

    initialize: function(options) {

        /**
         * The search string to filter the notes by.
         * @type {!string}
         * @protected
         */
        this.query = options.query || '';

        /**
         * The 1-indexed position of the last note to display.
         * @type {!number}
         * @protected
         */
        this.last = PAGE_SIZE;

        /**
         * The height in pixels of a non-maximized note container.
         * @type {!number}
         * @private
         */
        this.height_ = options.isPopout ? ''
            : preferences.searchLines * ITEM_HEIGHT_PX;

        this.listenTo(this.collection, "add", this.add);
        this.listenTo(this.collection, "change", this.change);
        this.listenTo(this.collection, "reset", this.render);
        this.listenTo(this.collection, "toDelete", this.toDelete);
    },

    /**
     * Add the supplied note to the list of notes.
     * @param {!Note} model
     */
    add: function(model) {
        var child;

        if (this.isIncluded_(model)) {
            child = this.insertChildView_(model);
            child.render();
            child.$el.prependTo(this.$('.results'));
            this.last++;
        }
    },

    /**
     * Sort the notes and prepare the list of notes for rendering.
     */
    beforeRender: function() {
        this.collection.sort();
        this.loop_(0, false);
    },

    /**
     * Update the supplied note in the list of notes.
     * @param {module:models/Note} model
     */
    change: function(model) {
        var child = this.getView(function(view) {
            return view.model.id == model.id;
        });

        if (child) {
            if (child.toDelete && !model.get('isDeleted')) {
                child.toDelete = false;
            } else if (this.isIncluded_(model)) {
                this.collection.sort();
                child.$el.prependTo(this.$('.results'));
            } else if (!model.get('isDeleted')) {
                // Remove the child if it wasn't deleted, but isn't
                // included.
                child.remove();
                this.last--;
            }
        } else if (!model.get('isDeleted')) {
            this.add(model);
        }
    },

    /**
     * Re-render the list filtered by the supplied query.
     * @param {!string} query
     */
    changeQuery: function(query) {
        this.query = query;
        this.last = 50;
        return this.render();
    },

    /**
     * Delete the selected note.
     * @param {!Event} event
     */
    deleteNote: function(event) {
        var model = this.getEventModel_(event);

        event.preventDefault();

        // Indirect via the "toDelete" event, because this case has to be
        // handled by both list views.
        if (!model.get('isDeleted')) {
            model.remove({
                success: function() {
                    storage.firstModified = model.get('modified');
                    model.trigger('toDelete', model);
                }
            });
        } else {
            model.trigger('toDelete', model);
        }
    },

    /**
     * Un-delete the selected note.
     * @param {!Event} event
     */
    undoDelete: function(event) {
        event.preventDefault();
        this.getEventModel_(event).undoRemove();
    },

    toDelete: function(model) {
        var child = this.getView(function(view) {
            return view.model.id == model.id;
        });

        if (child) {
            if (child.toDelete) {
                child.remove();
                this.last--;
            } else {
                child.toDelete = true;
            }
        }
    },

    /**
     * Trigger a note-edit event for the selected note.
     * @param {!Event} event
     */
    edit: function(event) {
        event.preventDefault();
        this.collection.trigger('edit', this.getEventModel_(event));
    },

    /**
     * Display additional notes.
     */
    more: function() {
        var startIndex = this.last;

        this.last += PAGE_SIZE;
        this.loop_(startIndex, true);

        if (!this.hasMore_()) {
            this.$('BUTTON[name=more]').remove();
        }
    },

    /**
     * Open a new tab to the URL of the clicked HTML anchor.
     * @param {!Event} event
     */
    navigate: function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        browser.openTab(event.currentTarget.href);
    },

    /**
     * Resize a note's container.
     * @param {!Event} event
     */
    resize: function(event) {
        var el = event.currentTarget;
        var pre = el.parentNode.parentNode.firstElementChild.nextElementSibling;
        var maxHeight = this.height_ + 'px';

        event.preventDefault();
        event.stopImmediatePropagation();

        if (pre.style.maxHeight == maxHeight) {
            pre.style.maxHeight = '';
            el.innerHTML = '';
            el.setAttribute('title', SHRINK_TITLE);
        } else {
            pre.style.maxHeight = maxHeight;
            el.innerHTML = '...';
            el.setAttribute('title', EXPAND_TITLE);
        }
        el.classList.toggle(MAXIMIZE_NOTE_CLASS);
    },

    /**
     * Return a template context object.
     * @return {!Object}
     */
    serialize: function() {
        return {
            hasMore: this.hasMore_(),
            length: this.collection.length,
            query: this.query
        };
    },

    /**
     * Return the note instance for the supplied event.
     * @param {!Event} event
     * @return {module:models/Note} model
     * @private
     */
    getEventModel_: function(event) {
        var article = event.currentTarget.parentElement;
        var noteId = article.getAttribute('data-id');

        return this.collection.get(noteId);
    },

    /**
     * Return true if there are more notes to fetch.
     * @return {!boolean}
     * @private
     */
    hasMore_: function() {
        return this.collection.slice(this.last).some(this.isIncluded_, this);
    },

    /**
     * Append a note view to the list of notes.
     * @param {module:models/Note} model
     * @return {!module:views/popup/Item}
     * @private
     */
    insertChildView_: function(model) {
        var child = new ItemView({ model: model, height: this.height_ });

        this.insertView('.results', child);
        return child;
    },

    /**
     * Return true if the supplied note should be included in the list of notes.
     * @param {module:models/Note} model
     * @return {!boolean}
     * @private
     */
    isIncluded_: function(model) {
        var query = this.query;

        return model.isReadable() && (!query || model.matches(query));
    },

    /**
     * Append an additional "page" of notes to the list of notes.
     * @param {!number} i Position in the note collection to start at.
     * @param {!boolean} renderChild If true, then render the child note views.
     *  This should be true if the parent (this view) will not also be rendered.
     * @private
     */
    loop_: function(i, renderChild) {
        var models = this.collection.models;
        var child;
        var model;

        for (; i < this.last && i < models.length; i++) {
            model = models[i];

            if (this.isIncluded_(model)) {
                child = this.insertChildView_(model);
                if (renderChild) {
                    child.render();
                }
            } else {
                this.last++;
            }
        }
    }
});