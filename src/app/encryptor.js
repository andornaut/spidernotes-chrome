/**
 * Encrypts and decrypts note attributes.
 * @module encryptor
 */

var sjcl = require('sjcl');
var storage = require('./storage');

module.exports = {

    /**
     * Decrypt and mutate the supplied attrs.
     * @param {!{body: string, url: string}} attrs
     */
    decrypt: function(attrs) {
        var password;

        if (this.isEncrypted(attrs)) {
            password = this.getPassword_();
            try {
                attrs.body = sjcl.decrypt(password, attrs.body);
            } catch (e) {
            }
            try {
                attrs.url = sjcl.decrypt(password, attrs.url);
            } catch (e) {
            }
        }
    },

    /**
     * Disable encryption and set the encryption password to null.
     */
    disable: function() {
        storage.encryptionPassword = this._password = '';
    },

    /**
     * Enable encryption and save a cryptographic hash of the supplied password.
     * @param {!string} password encryption password to save.
     */
    enable: function(password) {
        if (!password) {
            throw 'Invalid password';
        }
        password = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(password));
        storage.encryptionPassword = this._password = password;
    },

    /**
     * Encrypt and mutate the supplied attrs.
     * @param {!{body: string, url: string}} attrs
     */
    encrypt: function(attrs) {
        var password;

        if (this.isEnabled() && !this.isEncrypted(attrs)) {
            password = this.getPassword_();
            attrs.body = sjcl.encrypt(password, attrs.body);
            attrs.url = sjcl.encrypt(password, attrs.url);
        }
    },

    /**
     * Return true if encryption is enabled.
     * @return {!boolean}
     */
    isEnabled: function() {
        return Boolean(this.getPassword_());
    },


    /**
     * Return true if the supplied attrs are encrypted.
     * @param {!{body: string, url: string}} attrs
     * @return {!boolean}
     */
    isEncrypted: function(attrs) {
        return this.isEncryptedMessage_(attrs.body)
            || this.isEncryptedMessage_(attrs.url);
    },

    /**
     * Return the cached encryption password.
     * @return {?string}
     * @private
     */
    getPassword_: function() {
        // Cache the encryption password, so that we don't query the storage
        // engine more often than necessary.
        if (typeof this._password === 'undefined') {
            this._password = storage.encryptionPassword;
        }
        return this._password;
    },

    isEncryptedMessage_: function(message) {
        var json;

        if (!message) {
            return false;
        }
        try {
            json = JSON.parse(message);
        } catch (e) {
            // If the message is not valid JSON then it is not encrypted.
            return false;
        }

        /**
         * Even if the message can be parsed as JSON, it must also have the
         * following properties for it to be considered to be encrypted.
         *
         * n.b. A non-encrypted note could be created so as to appear to be
         * encrypted, but it's not likely that this would be unintentional, and
         * therefore there's not much value in guarding against it.
         */
        return json.iv && json.salt && json.cipher == 'aes';
    }
};