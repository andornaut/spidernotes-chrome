/**
 * User/application preferences
 * @module preferences
 * @property {!number} editorLines Number of lines of text to display in the
 *  note editor.
 * @property {!boolean} isSynchronizationEnabled True if synchronization is
 *  enabled.
 * @property {!number} searchLines Number of notes to display in each "page" of
 *  the note lists.
 */

module.exports = {

    /**
     * Delete all of the data in browser storage.
     */
    clear: function() {
        localStorage.removeItem('editorLines');
        localStorage.removeItem('isSynchronizationEnabled');
        localStorage.removeItem('searchLines');
    },

    get editorLines() {
        return parseInt(localStorage.getItem('editorLines')) || 10;
    },

    set editorLines(val) {
        localStorage.setItem('editorLines', val);
    },

    get isSynchronizationEnabled() {
        var val = localStorage.getItem('isSynchronizationEnabled');

        return JSON.parse(val) === true;
    },

    set isSynchronizationEnabled(val) {
        localStorage.setItem('isSynchronizationEnabled', val);
    },

    get searchLines() {
        return parseInt(localStorage.getItem('searchLines')) || 10;
    },

    set searchLines(val) {
        localStorage.setItem('searchLines', val);
    }
};
