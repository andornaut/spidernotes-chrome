/** @module layout */

var Layout = require('backbone.layoutmanager');

// Initialize Handlebars helpers.
require('../helpers');

// Configure backbone.layoutmanager. "manage: true" instructs
// backbone.layoutmanager to treat all Views as Layouts. "useRAF: false"
// disables batching of render calls into a RequestAnimationFrame callbacks,
// which does not work in the context of an extension background page.
Layout.configure({ manage: true, useRAF: false });

/**
 * Create and render a backbone.layoutmanager layout.
 * @param {!Window} window Global object.
 * @param {!function} template Handlebars template to use for the layout.
 * @param {!Array.<Backbone.View>} views Views to add to the layout.
 * @param {function=} unloadCallback Optional. Function to invoke when the
 *  layout is unloaded.
 */
module.exports = function(window, template, views, unloadCallback) {
    var layout = new Layout({ template: template, views: views });

    window.addEventListener('unload', function() {
        if (unloadCallback) {

            // Invoke the callback function before removing the views,
            // so that the callback can access the views.
            unloadCallback();
        }

        // Remove all views when the window is unloaded.
        for (var i = 0; i < views.length; i++) {
            views[i].remove();
        }
    }, true);

    // Render the layout after first adding it to the DOM, which  enables child
    // views to calculate the height of DOM elements.
    window.document.getElementById('main').appendChild(layout.$el[0]);
    layout.render();
};