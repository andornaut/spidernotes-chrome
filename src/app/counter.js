/**
 * Keeps track of the number of notes that link to websites in the web browser
 * tabs
 * @module counter
 */

var utils = require('./utils');

module.exports = {

    /**
     * Cached map of tab->number_of_notes.
     * @type {!Object}
     * @private
     */
    tabs_: {},

    /**
     * Return the number of notes that match the URL in the supplied tab.
     * Invoked when a Note event is triggered.
     * @param {!{id: !number, url: !string}} tab
     * @param {!module:models/Note} note
     * @return {!number}
     */
    countNote: function(tab, note) {
        var count = this.tabs_[tab.id] || 0;
        var isAdd = note.hasChanged('id');
        var isDelete = note.get('isDeleted');
        var isUndoDelete = !isDelete && note.hasChanged('isDeleted');
        var hostname = utils.getHostname(tab.url);
        var matches = note.matches(hostname);
        var matchedPreviously = note.matchedPreviously(hostname);

        /*
         * If the note was added, then ``matchedPreviously`` may be true
         * when it shouldn't be, because the previous URL defaults to the
         * current tab's url, so only decrement the count when not adding.
         */
        if (!isAdd && matchedPreviously && (!matches || isDelete)) {
            count--;
        } else if (matches && ((!matchedPreviously || isAdd) || isUndoDelete)) {
            count++;
        }
        this.tabs_[tab.id] = count;
        return count
    },

    /**
     * Return the number of notes that match the URL in the supplied tab.
     * Invoked when a NoteCollection event is triggered.
     * @param {!{id: !number, url: string}} tab
     * @param {!module:models/NoteCollection} notes
     * @return {!number}
     */
    countNotes: function(tab, notes) {
        return this.tabs_[tab.id] = notes.countMatches(tab.url);
    }
};