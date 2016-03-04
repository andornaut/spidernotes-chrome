/** @module models/NoteCollection */

var $ = require('jquery');
var Backbone = require('backbone');
var IDB = require('backbone-indexeddb');
var Note = require('./Note');
var database = require('../database');
var encryptor = require('../encryptor');
var tipsTemplate = require('../../templates/installed.tips.hbs');
var utils = require('../utils');
var welcomeTemplate = require('../../templates/installed.welcome.hbs');

/**
 * Represents a collection of notes.
 * @constructor
 * @augments Backbone.Collection
 */
module.exports = Backbone.Collection.extend(/** @lends module:models/NoteCollection# */ {

    /**
     * IndexedDB database.
     * @type {!Object}
     */
    database: database,

    /**
     * Constructor function of the members of this collection.
     * @type {!module:models/Note}
     */
    model: Note,

    /**
     * IndexedDB database name.
     * @type {!string}
     */
    storeName: 'notes',

    /**
     * backbone-indexeddb sync function.
     * @type {!function}
     */
    sync: IDB.sync,

    /**
     * Delete all of the notes in this collection.
     * @param {Object=} options
     * @return {!Promise}.
     */
    clear: function(options) {
        options || (options = {});
        this.reset([]);
        return this.sync('delete', this, options);
    },

    /**
     * Return the ordered position of the supplied note.
     * @param {!modules:models/Note} model
     * @return {!number}.
     */
    comparator: function(model) {
        return -1 * model.attributes.modified;
    },

    /**
     * Return the number of notes that match the supplied url.
     * @param {!string} url
     * @return {!number}
     */
    countMatches: function(url) {
        var hostname = utils.getHostname(url);
        var models = this.models;
        var count = 0;
        var model;

        for (var i = 0; i < models.length; i++) {
            model = models[i];
            if (model.isReadable() && model.matches(hostname)) {
                count++;
            }
        }
        return count;
    },

    /**
     * Create welcome notes.
     */
    createWelcomeNotes: function() {
        var now = new Date().getTime();

        this.create({
            id: 'welcome',
            body: welcomeTemplate({}),
            url: 'welcome',
            created: now,
            modified: now
        });
        this.create({
            id: 'tips',
            body: tipsTemplate({}),
            url: 'tips',
            created: now,
            modified: now
        });
    },

    /**
     * Delete all of the notes that are marked as deleted.
     * @param {!number} modified Modification timestamp before which to destroy
     *  Notes which are marked as deleted.
     * @private
     */
    destroyDeletedBefore: function(modified) {
        var models = this.models;
        var model;

        for (var i = 0; i < models.length; i++) {
            model = models[i];
            if (model.attributes.isDeleted
                && model.attributes.modified <= modified) {
                model.destroy({ silent: true });
            }
        }
    },

    /**
     * Decrypt all of the notes.
     * @return {!Array<Promise>}
     */
    decrypt: function() {
        return this.changeEncryption_(encryptor.decrypt);
    },

    /**
     * Encrypt all of the notes.
     * @return {!Array<Promise>}
     */
    encrypt: function() {
        return this.changeEncryption_(encryptor.encrypt);
    },

    /**
     * Return all of the notes that cannot be decrypted.
     * @return {!Array.<module:models/Note>}
     */
    getUndecryptable: function() {
        var models = this.models;
        var undecryptableNotes = [];
        var model;

        for (var i = 0; i < models.length; i++) {
            model = models[i];
            if (!model.attributes.isDeleted && model.isUndecryptable()) {
                undecryptableNotes.push(model);
            }
        }
        return undecryptableNotes;
    },

    /**
     * Apply an encryption or decryption function to all of the notes.
     * @param {!function} fn Encryption or decryption function
     * @return {!Array<Promise>}
     * @private
     */
    changeEncryption_: function(fn) {
        var models = this.models;
        var dfds = [];
        var attrs;
        var model;

        for (var i = 0; i < models.length; i++) {
            model = models[i];
            attrs = model.toJSON();

            fn.call(encryptor, attrs);

            // Defer triggering events until after all of the notes have been
            // processed.
            dfds.push(model.save(attrs, { silent: true }));
        }
        dfds = $.when.apply($, dfds);

        dfds.done(function() {
            // Trigger a reset event once all of the encryption / decryption
            // operations have completed.
            this.trigger('reset', this);
        }.bind(this));

        return dfds.promise();
    }
});