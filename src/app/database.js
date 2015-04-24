/**
 * backbone-indexeddb configuration.
 * @module database
 */

module.exports = {

    /**
     * @type {!string}
     */
    id: "spidernotes",

    /**
     * @type {!string}
     */
    description: "spidernotes",

    /**
     * @type {!Array}
     */
    migrations: [
        {
            version: 1,

            migrate: function(transaction, next) {
                var store = transaction.db.createObjectStore("notes");

                store.createIndex("modifiedIndex", "modified", {
                    unique: false
                });
                next();
            }
        }
    ],

    /**
     * {@link https://github.com/superfeedr/indexeddb-backbonejs-adapter/pull/8 Documentation}
     * @type {!boolean}
     */
    nolog: true
};