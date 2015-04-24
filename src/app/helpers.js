/**
 * Registers Handlebars template helpers.
 * @module helpers
 */

var Handlebars = require('hbsfy/runtime');

/**
 * {@link http://daringfireball.net/2010/07/improved_regex_for_matching_urls|Daring Fireball}
 * @type {RegExp}
 */
const URL_REGEX = /\b((?:chrome(?:-extension)?:\/\/|file:\/\/|ftp:\/\/|https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
const URL_REPLACE = '<a href="$1" title="Navigate">$1</a>';

// Register a template helper that can be used to render a <select> element.
Handlebars.registerHelper('select', function(value, label, current) {
    var selected = value == current ? ' selected' : '';
    var html = '<option value="' + value + '"' + selected + '>' + label + '</option>';

    return new Handlebars.SafeString(html);
});

// Register a template helper that can be used to render an <a> element.
Handlebars.registerHelper('linkify', function(text) {
    text = Handlebars.Utils.escapeExpression(text);
    text = text.replace(URL_REGEX, URL_REPLACE);
    return new Handlebars.SafeString(text);
});