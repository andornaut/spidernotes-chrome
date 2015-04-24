/** @module Synchronizer */

var $ = require('jquery');
var encryptor = require('./encryptor');
var preferences = require('./preferences');
var server = require('./server');
var storage = require('./storage');

const MIN_SYNC_PERIOD_SECS = 28800000; // 8 hours.

/**
 * Synchronizes notes to/from the remote server.
 * @param {!module:models/note_collection} notes
 * @constructor
 * @alias module:Synchronizer
 */
var Synchronizer = function(notes) {

    /**
     * @type {!module:models/NoteCollection}
     * @private
     */
    this.notes_ = notes;
};

/**
 * Disable synchronization.
 */
Synchronizer.prototype.disable = function() {
    preferences.isSynchronizationEnabled = false;
};


/**
 * Enable synchronization.
 */
Synchronizer.prototype.enable = function() {
    preferences.isSynchronizationEnabled = true;
};

/**
 * Return a JSON string representation of the non-deleted and non-undecryptable
 * notes.
 * @return {!string}
 */
Synchronizer.prototype.exportNotes = function() {
    return JSON.stringify(this.notes_.filter(function(note) {
        return note.isReadable();
    }));
};

/**
 * Import the supplied JSON notes.
 * @param {!Object} incomingNotes
 * @return {!Promise}
 */
Synchronizer.prototype.importNotes = function(incomingNotes) {
    this.merge_(incomingNotes, true);
    return this.syncAll();
};

/**
 * Return true if synchronization is enabled.
 * @return {!boolean}
 */
Synchronizer.prototype.isEnabled = function() {
    return preferences.isSynchronizationEnabled;
};

/**
 * Synchronize all of the notes.
 * @return {!Promise}
 */
Synchronizer.prototype.syncAll = function() {
    var firstModified = storage.firstModified;
    var lastSynchronized = 0;
    var outgoingNotes = this.notes_.models;

    return this.sync_(outgoingNotes, firstModified, lastSynchronized);
};

/**
 * Synchronize notes which have been modified since the last successful
 * synchronization.
 * @return {!Promise}
 */
Synchronizer.prototype.syncModified = function() {
    var firstModified = storage.firstModified;
    var lastSynchronized = storage.lastSynchronized;
    var outgoingNotes = [];

    // When a synchronization attempt succeeds, firstModified is set to
    // 0, so only send notes if it is not 0.
    if (firstModified) {
        outgoingNotes = this.notes_.filter(function(note) {
            return note.get('modified') >= firstModified;
        });
    }
    return this.sync_(outgoingNotes, firstModified, lastSynchronized);
};

/**
 * Synchronize notes if they were last synchronized 8 hours ago.
 * @return {!Promise}
 */
Synchronizer.prototype.syncPeriodically = function() {
    var lastSynchronized = storage.lastSynchronized;

    if (lastSynchronized
        && new Date().getTime() - lastSynchronized > MIN_SYNC_PERIOD_SECS) {
        this.syncModified();
    }
};

/**
 * Synchronize notes to/from the remote server.
 * @param {!Array} outgoingNotes Notes to send to the remote server.
 * @param {!number} firstModified Modification timestamp of the first Note to be
 *  modified since the last successful synchronization.
 * @param {!number} lastSynchronized Timestamp of the last successful
 *  synchronization.
 * @return {!Promise}
 */
Synchronizer.prototype.sync_ = function(outgoingNotes, firstModified, lastSynchronized) {
    var promise;

    if (!this.isEnabled()) {
        promise = $.Deferred().resolve().promise();
    } else {
        promise = this.send_(outgoingNotes, lastSynchronized);

        promise.done(function() {
            this.notes_.destroyDeletedBefore(firstModified);
        }.bind(this));

        promise.done(function(data) {
            storage.lastSynchronized = data.lastSynchronized;

            // firstModified is used to determine which notes to send out, so if
            // it hasn't changed while synchronization was in progress, then
            // reset it.
            if (storage.firstModified == firstModified) {
                storage.firstModified = 0;
            }

            this.merge_(data.notes, false);
        }.bind(this));
    }
    return promise;
};

/**
 * Merge notes fetched from the serve into the local NoteCollection.
 * @param {!Object} incomingNotes JSON notes form the server.
 * @param {?Boolean} always_overwrite If true, then always overwrite existing
 *  notes.
 * @private
 */
Synchronizer.prototype.merge_ = function(incomingNotes, always_overwrite) {
    var options = { silent: true };
    var len = incomingNotes.length;
    var existingNote;
    var incomingAttrs;

    if (len) {
        for (var i = 0; i < len; i++) {
            incomingAttrs = incomingNotes[i];
            existingNote = this.notes_.get(incomingAttrs.id);

            encryptor.encrypt(incomingAttrs);

            if (existingNote) {
                if (always_overwrite
                    || incomingAttrs.modified >= existingNote.get('modified')) {
                    existingNote.save(incomingAttrs, options);
                }
            } else {
                this.notes_.create(incomingAttrs, options);
            }
        }
        this.notes_.trigger('reset', this.notes_);
    }
};


/**
 * Send a synchronization request to the remote server.
 * @param {!Array} outgoingNotes Notes that have changed since the last
 *  synchronization
 * @param {!number} lastSynchronized Timestamp that was previously returned by
 *  the server during the last synchronization.
 * @return {!Promise}
 * @private
 */
Synchronizer.prototype.send_ = function(outgoingNotes, lastSynchronized) {
    var encryptedNotes = [];
    var noteAttrs;
    var data;

    for (var i = 0; i < outgoingNotes.length; i++) {
        // Convert to JSON in order to avoid mutating the in-memory Note.
        noteAttrs = outgoingNotes[i].toJSON();
        encryptor.encrypt(noteAttrs);
        encryptedNotes.push(noteAttrs);
    }

    data = JSON.stringify({
        lastSynchronized: lastSynchronized, notes: encryptedNotes
    });
    return server.syncNotes(data).promise();
};

module.exports = Synchronizer;