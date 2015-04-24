/**
 * Provides an interface for interacting with the browser storage engine.
 * @module storage
 * @property {?string} encryptionPassword Hash of the encryption password.
 * @property {!number} firstModified Modification timestamp of the first Note to
 *  be modified since the last successful synchronization.
 * @property {!boolean} isEditorMaximized True if the editor textarea is
 *  maximized.
 * @property {!boolean} isSearchMaximized True if the search pane is maximized.
 * @property {!number} lastSynchronized Timestamp of the last successful
 *  synchronization.
 *
 * @property {!Object} editorState Note editor state.
 */

module.exports = {

    /**
     * Delete all of the data in storage.
     */
    clear: function() {
        localStorage.removeItem('editorState');
        localStorage.removeItem('encryptionPassword');
        localStorage.removeItem('firstModified');
        localStorage.removeItem('isEditorMaximized');
        localStorage.removeItem('isSearchMaximized');
        localStorage.removeItem('lastSynchronized');
    },

    get editorState() {
        var val = localStorage.getItem('editorState');

        return val ? JSON.parse(val) : {};
    },

    set editorState(val) {
        localStorage.setItem('editorState', val);
    },

    get encryptionPassword() {
        return localStorage.getItem('encryptionPassword');
    },

    set encryptionPassword(val) {
        localStorage.setItem('encryptionPassword', val);
    },

    get isEditorMaximized() {
        return JSON.parse(localStorage.getItem('isEditorMaximized'));
    },

    set isEditorMaximized(val) {
        localStorage.setItem('isEditorMaximized', val);
    },

    get isSearchMaximized() {
        return JSON.parse(localStorage.getItem('isSearchMaximized')) == true;
    },

    set isSearchMaximized(val) {
        localStorage.setItem('isSearchMaximized', val);
    },

    get firstModified() {
        return parseFloat(localStorage.getItem('firstModified')) || 0;
    },

    /**
     * Save a "first modified" timestamp if any of the following is true:
     *
     *  a) There is no previous timestamp in storage.
     *  b) Either the previous or supplied timestamps are 0.
     *  c) The supplied timestamp is older than the previous timestamp.
     * @param {!number} val Timestamp.
     * @private
     */
    set firstModified(val) {
        // Can only set to 0 or an older date.
        var old = this.firstModified;

		if (val === 0 || old === 0 || val < old) {
            localStorage.setItem('firstModified', val);
        }
    },

    get lastSynchronized() {
        return parseFloat(localStorage.getItem('lastSynchronized') || 0);
    },

    set lastSynchronized(val) {
        localStorage.setItem('lastSynchronized', val);
    }
};