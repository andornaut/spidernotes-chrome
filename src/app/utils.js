/**
 * Provides common utility functions.
 * @module utils
 */

const BASE_URL = 'https://spider-notes.appspot.com';
const EXTRACT_HOSTNAME_AND_LOWER_REGEX = /^\s*(?:(?:[\w-]+:\/\/)?(\/?[\w-]+(?:\.[\w-]+)*))/i;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STRIP_COMMA_REGEX = /(^,)|(,$)/g;
const STRIP_SCHEME_REGEX = /^\s*(?:[\w-]+:\/\/)?(.*)/i;
const WORD_DELIMITER_REGEX = /[,\s]+/g;

/**
 * @param {!Date} dt
 * @return {!string}
 */
function getShortDate(dt) {
    var dayNumber = dt.getDate();
    var monthName = MONTHS[dt.getMonth()];

    return monthName + ' ' + dayNumber;
}

/**
 * @param {!Date} dt
 * @return {!string}
 */
function getTime(dt) {
    var hour = dt.getHours();
    var min = dt.getMinutes();
    var suffix = hour < 12 ? 'am' : 'pm';

    if (hour == 0) {
        hour = 12;
    } else if (hour > 12) {
        hour -= 12;
    }

    if (min < 10) {
        min = '0' + min;
    }
    return hour + ':' + min + ' ' + suffix;
}

module.exports = {
    /**
     * Return a human-readable text representation of the supplied timestamp.
     * @param {!Date} dt
     * @return {!string}
     */
    formatDate: function(dt) {
        var today = new Date();
        var result;

        if (dt.getFullYear() != today.getFullYear()) {
            result = getShortDate(dt) + ', ' + dt.getFullYear();
        } else if (dt.getDate() != today.getDate() || dt.getMonth() != today.getMonth()) {
            result = getShortDate(dt);
        } else {
            result = getTime(dt);
        }
        return result;
    },

    /**
     * Return a hostname that is extracted from the supplied url, or an empty
     * string if the URL does not contain a URL scheme.
     * @param {!string} url
     * @return {!string}
     */
    getHostname: function(url) {
        var matches = url.match(EXTRACT_HOSTNAME_AND_LOWER_REGEX);

        return matches ? matches[1].toLowerCase() : '';
    },

    /**
     * Return an absolute server URL.
     * @param {!string} path Path to add to the URL.
     * @return {!string}
     */
    getUrl: function(path) {
        return BASE_URL + path;
    },

    /**
     * Return true if the supplied url is a Social Login callback.
     * @param {!string} url
     * @return {!boolean}
     */
    isSocialCallbackUrl: function(url) {
        return url.indexOf(BASE_URL) === 0 && url.indexOf('/callback') > 0;
    },

    /**
     * Split the supplied str by either commas or spaces, and return an array of
     * unique, trimmed, non-empty strings.
     * @param {!string} str
     * @return {!Array}
     */
    splitUniqueWords: function(str) {
        var words = str.replace(WORD_DELIMITER_REGEX, ' ').split(' ');

        return words.filter(function(item, i, arr) {
            // Filter out empty and/or duplicate words.
            return item && i == arr.indexOf(item);
        });
    },

    /**
     * Return a new string with leading and trailing commas removed.
     * @param {!string} str
     * @return {!string}
     */
    stripComma: function(str) {
        return str.replace(STRIP_COMMA_REGEX, '');
    },

    /**
     * Return a new URL that does not include the URL scheme, or return
     * the supplied string if it does not include a URL scheme.
     * @param {!string} url
     * @return {!string}
     */
    stripScheme: function(url) {
        var matches = url.match(STRIP_SCHEME_REGEX);

        return matches ? matches[1] : url;
    }
};