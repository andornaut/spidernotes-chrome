/** @module views/popup/Editor */

var Backbone = require('backbone');
var encryptor = require('../../encryptor');
var preferences = require('../../preferences');
var storage = require('../../storage');
var template = require('../../../templates/popup/editor.hbs');
var utils = require('../../utils');

const EXPAND_CLASS = 'fa-expand';
const SHRINK_CLASS = 'fa-compress';
const ENCRYPTED_CLASS = 'encrypted';
const ENCRYPTION_ICON_SELECTOR = '.encryption-toggle';
const INSERT_WEB_ADDRESS_CLASS = 'fa-link';
const INSERT_WEB_ADDRESS_TITLE = 'Insert web-address';
const CLEAR_WEB_ADDRESS_CLASS = 'fa-times';
const CLEAR_WEB_ADDRESS_TITLE = 'Clear web-address';
const POPOUT_EDITOR_LINES = 15;

/**
 * Renders the note editor section of the popup page.
 * @constructor
 * @augments Backbone.View
 */
module.exports = Backbone.View.extend(/** @lends module:views/popup/Editor# */ {
    events: {
        'click BUTTON[name=delete]': 'deleteNote',
        'click BUTTON[name=discard]': 'discard',
        'click BUTTON[name=save]': 'save',
        'click I.fa-link, I.fa-times': 'updateUrlField',
        'click A.resize': 'resize',
        'click A.undo-delete': 'undoDelete',
        'click A.undo-discard': 'undoDiscard',
        'input INPUT': 'updateUrlIcon',
        'keydown TEXTAREA': 'saveOnEnter',
        'submit FORM': 'save'
    },

    /**
     * Handlebars template function.
     * @type {!function}
     */
    template: template,

    initialize: function(options) {

        /**
         * The most recently deleted note.
         * @type {?module:models/Note}
         * @private
         */
        this.deleted_model_ = null;

        /**
         * The most recently discarded editor data.
         * @type {?Object}
         * @private
         */
        this.discarded_attrs_ = null;

        /**
         * Number of lines of text to display in the note editor.
         * @type {!number}
         * @private
         */
        this.editorLines_ = options.isPopout ? POPOUT_EDITOR_LINES : preferences.editorLines;

        /**
         * @type {!EditorState_}
         * @private
         */
        this.state_ = options.isPopout
            ? new PopoutEditorState_(this.collection)
            : new EditorState_(this.collection, options.tabUrl);

        /**
         * True if this view has been rendered at least once.
         * @type {!boolean}
         * @private
         */
        this.hasRendered_ = false;

        /**
         * @type {!boolean}
         * @private
         */
        this.isMaximized_ = storage.isEditorMaximized;

        /**
         * @type {!boolean}
         * @private
         */
        this.isPopout_ = options.isPopout;

        /**
         * @type {!module:models/Note}
         * @protected
         */
        this.model = this.state_.getModel();

        /**
         * Web-address of the current tab.
         * @type {!string}
         * @private
         */
        this.tabUrl_ = options.tabUrl;

        /**
         * Global window object.
         * @type {!Window}
         * @private
         */
        this.window_ = options.window;

        this.listenTo(this.collection, 'edit', this.edit);
    },

    /**
     * Focus the mouse cursor on the textarea whenever this view is rendered.
     */
    afterRender: function() {
        if (this.isMaximized_) {
            this.maximize_();
        }
        this.$('TEXTAREA').focus();
    }
    ,
    /**
     * Delete the selected note.
     */
    deleteNote: function() {
        var model = this.model;

        if (model.get('isDeleted')) {
            this.discard();
        } else {
            model.remove({
                success: function() {
                    storage.firstModified = model.get('modified');
                    this.discard();
                    model.trigger('toDelete', model);
                }.bind(this)
            });
        }
    },

    /**
     * Discard the content of note editor and reset to the default state.
     */
    discard: function() {
        var attrs = {
            body: this.$('TEXTAREA').val().trim(),
            url: this.$('INPUT').val().trim()
        };
        var newModel = this.state_.createModel();
        var oldModel = this.model;
        var isAdd = oldModel.isNew();
        var hasChanged = function(model) {
            return (attrs.body != model.get('body') || attrs.url != model.get('url'));
        };

        if (hasChanged(isAdd ? newModel : oldModel)) {
            this.deleted_model_ = oldModel;
            this.discarded_attrs_ = attrs;
        } else {
            this.deleted_model_ = isAdd ? null : oldModel;
            this.discarded_attrs_ = null;
        }
        this.model = newModel;
        this.render();
    },

    /**
     * Un-delete the selected note.
     * @param {!Event} event
     */
    undoDelete: function(event) {
        event.preventDefault();
        this.deleted_model_.undoRemove();
        this.undoDiscard();
    },

    /**
     * Un-discard the selected note.
     * @param {Event=} event
     */
    undoDiscard: function(event) {
        var body;
        var url;

        if (event) {
            event.preventDefault();
        }

        if (this.discarded_attrs_) {
            body = this.discarded_attrs_.body;
            url = this.discarded_attrs_.url;
        } else {
            body = this.deleted_model_.get('body');
            url = this.deleted_model_.get('url');
        }

        this.model = this.deleted_model_;

        this.resetUndo_();
        this.render().promise().done(function() {
            this.$('TEXTAREA').val(body);
            this.$('INPUT').val(url);
        }.bind(this));
    },

    /**
     * Respond to a note-edit event.
     * @param {!Note} model
     */
    edit: function(model) {
        this.model = model;
        this.resetUndo_();
        this.render();
    },

    /**
     * Expand or shrink the note editor textarea.
     * @param {!Event} event
     */
    resize: function(event) {
        var a = event.currentTarget;
        var icon = a.firstElementChild;

        event.preventDefault();

        if (this.isMaximized_) {
            this.$('TEXTAREA').css('height', '');
        } else {
            this.maximize_();
        }
        icon.classList.toggle(EXPAND_CLASS);
        icon.classList.toggle(SHRINK_CLASS);
        this.isMaximized_ = !this.isMaximized_;
    },

    maximize_: function() {
        var $textarea = $textarea = this.$('TEXTAREA');
        var $editor = this.$el.closest('SECTION');
        var $encryption = $editor.prev('SECTION');
        var textarea_h = $textarea.height();
        var editor_h = $editor.height();
        var encryption_h = $encryption.height();
        var window_h = this.window_.innerHeight;

        $textarea.height(window_h - editor_h - encryption_h + textarea_h);
    },

    /**
     * Save the note.
     * @param {!Event} event
     */
    save: function(event) {
        event.preventDefault();

        var model = this.model;
        var isNew = model.isNew();
        var now = new Date().getTime();
        var attrs = {
            body: this.$('TEXTAREA').val().trim(),
            url: this.$('INPUT').val().trim(),
            created: model.get('created') || now,
            modified: now,
            isDeleted: false
        };

        if (!model.validate(attrs)) {
            this.resetUndo_();
            this.model = this.state_.createModel();
            this.render();

            encryptor.encrypt(attrs);
            if (isNew) {
                this.collection.add(model, { silent: true });
            }
            // `wait` prevents extra event from being emitted.
            model.save(attrs, { wait: true });
            storage.firstModified = model.get('modified');
        }
    },

    /**
     * Save the note when the CTRL+ENTER or SHIFT+ENTER keys are pressed.
     * @param {!Event} event
     */
    saveOnEnter: function(event) {
        if (event.keyCode == 13 && (event.ctrlKey || event.shiftKey)) {
            this.save(event);
        }
    },

    /**
     * Save the current state of the note editor.
     * @return {!boolean} True if a note was added/modified/deleted.
     */
    saveState: function() {
        var body = this.$('TEXTAREA').val().trim();
        var url = this.$('INPUT').val().trim();
        var id = this.model.id;
        var attrs;

        if (this.model.get('isDeleted')) {
            attrs = { id: null, body: '', url: '' }
        } else {
            attrs = { id: id, body: body, url: url }
        }
        storage.isEditorMaximized = this.isMaximized_;
        this.state_.save({ id: id, body: body, url: url });
    },

    /**
     * Return a template context object.
     * @return {!Object}
     */
    serialize: function() {
        var context;
        var modified;

        if (this.hasRendered_) {
            context = this.model.toJSON();
        } else {
            // Only used the saved state the first time this view is rendered.
            context = this.state_.serialize();
        }
        if (context.modified) {
            modified = new Date(context.modified);
            context.modified = modified.toISOString();
            context.modifiedHuman = utils.formatDate(modified);
        }

        context.editorLines = this.editorLines_;
        context.resizeClass = this.isMaximized_ ? SHRINK_CLASS : EXPAND_CLASS;
        context.isEncryptionEnabled = encryptor.isEnabled();

        if (this.deleted_model_ && this.deleted_model_.get('isDeleted')) {
            context.show_undo_delete = true;
        } else if (this.discarded_attrs_) {
            context.show_undo_discard = true
        }
        this.hasRendered_ = true;
        return context;
    },

    /**
     * Update the encryption icon.
     */
    updateEncryptionIcon: function() {
        var $anchor = this.$(ENCRYPTION_ICON_SELECTOR);

        if (encryptor.isEnabled()) {
            $anchor.addClass(ENCRYPTED_CLASS);
        } else {
            $anchor.removeClass(ENCRYPTED_CLASS);
        }
    },

    updateUrlField: function() {
        var $input = this.$('INPUT[name=url]');

        if ($input.val()) {
            $input.val('');
        } else if (!this.isPopout_) {
            $input.val(this.tabUrl_);
        }
        this.updateUrlIcon();
    },

    updateUrlIcon: function() {
        var $input;
        var $icon;

        if (!this.isPopout_) {
            $input = this.$('INPUT[name=url]');
            $icon = this.$('.fa-times, .fa-link');

            if ($input.val()) {
                $icon.attr('title', CLEAR_WEB_ADDRESS_TITLE);
                $icon.addClass(CLEAR_WEB_ADDRESS_CLASS);
                $icon.removeClass(INSERT_WEB_ADDRESS_CLASS);
            } else if (!this.isPopout_) {
                $icon.attr('title', INSERT_WEB_ADDRESS_TITLE);
                $icon.addClass(INSERT_WEB_ADDRESS_CLASS);
                $icon.removeClass(CLEAR_WEB_ADDRESS_CLASS);
            }
        }
    },

    /**
     * Forget all deleted or discarded data.
     * @private
     */
    resetUndo_: function() {
        this.deleted_model_ = null;
        this.discarded_attrs_ = null;
    }
});


/**
 * Keeps track of the note editor's state after the popup page has been closed.
 * @param {!module:models/NoteCollection} collection
 * @param {!string} tabUrl
 * @constructor
 * @private
 */
var EditorState_ = function(collection, tabUrl) {
    var state = storage.editorState;

    /**
     * @type {!Object}
     * @private
     */
    this.attributes_ = state.attributes || {};

    /**
     * @type {!module:models/NoteCollection}
     * @private
     */
    this.collection_ = collection;

    /**
     * @type {!string}
     * @private
     */
    this.previousTabUrl_ = state.previousTabUrl;

    /**
     * @type {!string}
     * @private
     */
    this.tabUrl_ = tabUrl;
};

/**
 * Return a newly created note.
 * @return {!module:models/Note}
 */
EditorState_.prototype.createModel = function() {
    return new this.collection_.model({ url: this.tabUrl_ });
};

/**
 * Return a note from the NoteCollection whose id matches the cached id, or
 * return a new note if one cannot be found.
 * @return {!module:models/Note}
 */
EditorState_.prototype.getModel = function() {
    var existingId = this.attributes_.id;
    var model = existingId ? this.collection_.get(existingId) : null;

    if (!model) {
        model = this.createModel();
    }
    return model;
};

/**
 * @param {!object} attributes
 * Save the supplied note editor state.
 */
EditorState_.prototype.save = function(attributes) {
    storage.editorState = JSON.stringify({
        attributes: attributes,
        previousTabUrl: this.tabUrl_
    });

    this.attributes_ = attributes;
    this.previousTabUrl_ = this.tabUrl_;
};


/**
 * Return a template context object.
 * @return {!Object}
 */
EditorState_.prototype.serialize = function() {
    return this.useSaved_() ? this.attributes_ : this.createModel().toJSON();
};


/**
 * Return true if the saved attributes should be used.
 * @return {!boolean}
 * @private
 */
EditorState_.prototype.useSaved_ = function() {
    var body = this.attributes_.body;
    var url = this.attributes_.url

    // True if the body is not empty, or if the url is not-empty and differs
    // from the previous tabUrl.
    return body || (url && url != this.previousTabUrl_)
};

/**
 * Provides the same interface as EditorState_, but does not actually keep
 * track of the note editor's state.
 * @param {!module:models/NoteCollection} collection
 * @constructor
 * @private
 */
var PopoutEditorState_ = function(collection) {
    /**
     * @type {!module:models/NoteCollection}
     * @private
     */
    this.collection_ = collection;
};

var createModel_ = function() {
    return new this.collection_.model();
};

PopoutEditorState_.prototype.createModel = createModel_;

PopoutEditorState_.prototype.getModel = createModel_;

PopoutEditorState_.prototype.save = function() {
};

PopoutEditorState_.prototype.serialize = function() {
    return this.collection_.model.prototype.defaults;
};