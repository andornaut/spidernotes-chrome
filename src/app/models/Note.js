/** @module models/Note */

var Backbone = require('backbone');
var IDB = require('backbone-indexeddb');
var database = require('../database');
var encryptor = require('../encryptor');
var utils = require('../utils');

/**
 * Represents a note.
 * @constructor
 * @augments Backbone.Model
 */
module.exports = Backbone.Model.extend(/** @lends module:models/Note# */ {

    /**
     * IndexedDB database.
     * @type {!Object}
     */
    database: database,

    /**
     * Default note attributes.
     * @type {!Object}
     */
    defaults: {
        body: '',
        url: '',
        created: null,
        modified: null,
        isDeleted: false
    },

    /**
     * IndexedDB database name.
     * @type {!string}
     */
    storeName: 'notes',

    /**
     * Backbone-indexeddb sync function.
     * @type {!function}
     */
    sync: IDB.sync,

    /**
     * Return true if the note is not deleted and is either not encrypted
     * or has been decrypted successfully.
     * @return {!boolean}
     */
    isReadable: function() {
        return !this.get('isDeleted') && !this.isUndecryptable();
    },

    /**
     * Return true if the note cannot be decrypted successfully.
     * @return {!boolean}
     */
    isUndecryptable: function() {
        return encryptor.isEncrypted(this.attributes);
    },

    /**
     * Return true if the note matches the supplied query.
     * @param {!string} query Query to search for, which must be lowercase.
     * @return {!boolean}
     */
    matches: function(query) {
        return this.matches_(this.get('body'), this.get('url'), query)
    },

    /**
     * Return true if the note used to matches the supplied query.
     * @param {!string} query Query to search for, which must be lowercase.
     * @return {!boolean}
     */
    matchedPreviously: function(query) {
        var attrs = this.previousAttributes();

        return this.matches_(attrs.body || '', attrs.url || '', query)
    },

    /**
     * Parse and decrypt the response from IndexedDB.
     * @param {!Object} response Response from IndexedDB.
     * @return {!Object} The note's attributes.
     */
    parse: function(response) {
        encryptor.decrypt(response);
        return response;
    },

    /**
     * Delete the note.
     * @param {Object=} options
     */
    remove: function(options) {
        options = options || {};
        this.save({ isDeleted: true, modified: new Date().getTime() }, options);
    },

    /**
     * Un-delete the note.
     * @param {Object=} options
     */
    undoRemove: function(options) {
        options = options || {};
        this.save({
            isDeleted: false,
            modified: new Date().getTime()
        }, options);
    },

    /**
     * Validate that the note's body and url are not both falsy.
     * @return {?Array} An array if there are 1 or more errors, or null
     * otherwise.
     */
    validate: function(attrs) {
        var errors = [];

        if (!attrs.body && !attrs.url) {
            errors.push({
                location: 'body',
                message: 'Both the "Body" and "Web-addresses and/or tags" fields cannot be blank.'
            });
        }
        return errors.length ? errors : null;
    },

    /**
     * Return true if the note matches the supplied query.
     * @param {!string} body
     * @param {!string} url
     * @param {!string} query Query to search for, which must be lowercase.
     * @return {!boolean}
     * @private
     */
    matches_: function(body, url, query) {
        var words = query.split(/\s+/);
        var word;

        body = body.toLowerCase();
        url = url.toLowerCase();

        for (var i = 0; i < words.length; i++) {
            word = words[i];

            if (body.indexOf(word) == -1 && url.indexOf(word) == -1) {
                return false;
            }
        }
        return true;
    }
});