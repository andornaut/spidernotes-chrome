/** @module views/options/Backup */

var Backbone = require('backbone');
var encryptor = require('../../encryptor');
var preferences = require('../../preferences');
var storage = require('../../storage');
var template = require('../../../templates/options/backup.hbs');

/**
 * Renders the backup section of the options page.
 * @constructor
 * @augments Backbone.View
 */
module.exports = Backbone.View.extend(/** @lends module:views/options/Backup# */ {
    events: {
        'click BUTTON[name=delete_data]': 'deleteData',
        'click A': 'exportNotes',
        'click BUTTON[name=import_notes]': 'importNotes'
    },

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

        /**
         * @type {!module:models/User}
         * @private
         */
        this.user_ = options.user;
    },

    /**
     * Delete the user's account on the remote server, and delete all locally
     * saved data.
     */
    deleteData: function() {
        this.user_.remove();
        this.notes_.clear();
        this.synchronizer_.disable();

        encryptor.disable();
        preferences.clear();
        storage.clear();

        this.__manager__.parent.render();
    },

    /**
     * Download exported notes.
     */
    exportNotes: function() {
        var jsonString = this.synchronizer_.exportNotes();
        var blob = new Blob([jsonString], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);

        this.$('A').attr('href', url);
    },

    /**
     * Import notes from the file input widget.
     */
    importNotes: function() {
        var $input = this.$('INPUT');
        var file = $input[0].files[0];
        var synchronizer = this.synchronizer_;

        if (file) {
            var reader = new FileReader();

            reader.onload = function(event) {
                synchronizer.importNotes(JSON.parse(event.target.result));
            };
            reader.readAsText(file);
            $input.val('');
        }
    }
});