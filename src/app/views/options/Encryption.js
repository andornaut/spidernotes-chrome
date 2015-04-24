/** @module views/options/Encryption */

var Backbone = require('backbone');
var encryptor = require('../../encryptor');
var template = require('../../../templates/options/encryption.hbs');

/**
 * Renders the encryption section of the options page.
 * @constructor
 * @augments Backbone.View
 */
module.exports = Backbone.View.extend(/** @lends module:views/options/Encryption# */ {
    events: {
        'submit': 'submit',
        'click A.close': 'hide',
        'click BUTTON[name=delete_undecryptable]': 'deleteUndecryptable',
        'click BUTTON[name=disable]': 'disable'
    },

    /**
     * HTML tag name of this view's root element.
     * @type {!string}
     */
    tagName: 'FORM',

    /**
     * Handlebars template function.
     * @type {!function}
     */
    template: template,

    initialize: function(options) {

        /**
         * @type {!module:models/NoteCollection}
         * @private
         */
        this.notes_ = options.notes;

        /**
         * @type {!module:Synchronizer}
         * @private
         */
        this.synchronizer_ = options.synchronizer;
    },

    /**
     * Delete all notes that cannot be decrypted.
     * @param {!Event} event
     */
    deleteUndecryptable: function(event) {
        var undecryptableNotes = this.notes_.getUndecryptable();

        event.preventDefault();

        for (var i = 0; i < undecryptableNotes.length; i++) {
            undecryptableNotes[i].remove({ silent: true });
        }

        this.synchronizer_.syncAll().done(this.render.bind(this));
    },

    /**
     * Disable encryption, remove the encryption password and syncModified all
     * notes.
     * @param {!Event} event
     */
    disable: function(event) {
        var sync = this.synchronizer_.syncAll.bind(this.synchronizer_);

        event.preventDefault();

        this.notes_.decrypt().done(function() {
            encryptor.disable();
            this.render();
        }.bind(this)).done(sync);
    },

    /**
     * Hide the encryption section.
     * @param {!Event} event
     */
    hide: function(event) {
        event.preventDefault();
        this.$el.hide();
    },

    /**
     * Return a template context object.
     * @return {!Object}
     */
    serialize: function() {
        return {
            isEncryptionEnabled: encryptor.isEnabled(),
            numUndecryptable: this.notes_.getUndecryptable().length
        };
    },

    /**
     * Set an encryption password, and then encrypt and syncModified all of the
     * notes.
     * @param {!Event} event
     */
    submit: function(event) {
        var password = this.$('INPUT[type=password]').val();

        event.preventDefault();

        if (password) {
            encryptor.enable(password);

            this.notes_.encrypt().then(function() {
                this.render();
                this.synchronizer_.syncAll();
            }.bind(this));
        }
    }
});