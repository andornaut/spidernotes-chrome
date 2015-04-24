/**
 * Provides an interface for communicating with the remote server.
 * @module server
 */

var $ = require('jquery');
var utils = require('./utils');

const DISCONNECT_URL = utils.getUrl('/api/disconnect');
const SYNC_URL = utils.getUrl('/api/sync');
const USER_URL = utils.getUrl('/api/user');

module.exports = {
    /**
     * Send a delete-user request to the server.
     * @return {!jqHXR}
     */
    deleteUser: function() {
        return $.ajax(USER_URL, {
            dataType: 'json',
            type: 'DELETE'
        });
    },

    /**
     * Send a disconnect-user request to the server.
     * @return {!jqHXR}
     */
    disconnectUser: function() {
        return $.ajax(DISCONNECT_URL, {
            dataType: 'json',
            type: 'POST'
        })
    },

    /**
     * Send a get-user request to the server.
     * @return {!jqHXR}
     */
    getUser: function() {
        return $.ajax(USER_URL, {
            dataType: 'json',
            type: 'GET'
        });
    },

    /**
     * Configure the jQuery ajax system to send authentication information with
     * every ajax request.
     * @param {!module:models/Note} user
     */
    setUser: function(user) {
        $.ajaxSetup({
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-Messaging-Token', user.get('token'));
            }
        });
    },

    /**
     * Send a sync-notes request to the server.
     * @return {!jqHXR}
     */
    syncNotes: function(data) {
        return $.ajax(SYNC_URL, {
            data: data,
            dataType: 'json',
            type: 'POST'
        });
    }
};