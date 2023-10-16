
/**
 * A wrapper for IndexedDB operations.
 * @param {string} dbName - The name of the IndexedDB database.
 * @param {string} [key='id'] - The key path to use for object store.
 * @returns {Promise<{ getEntry: Function, getAll: Function, put: Function, add: Function, deleteEntry: Function, deleteAll: Function, flush: Function, count: Function }>} A promise that resolves to an object with IndexedDB methods.
 */

const DB = function DB(dbName, key = 'id') {

    return new Promise((resolve, reject) => {
        const openDBRequest = window.indexedDB.open(dbName, 1);
        const storeName = `${dbName}_store`;
        let db;


        const _upgrade = () => {
            db = openDBRequest.result;
            db.createObjectStore(storeName, { keyPath: key });
        };

        /**
    * Performs a query on the IndexedDB store.
    * @param {string} method - The method to use (e.g., 'get', 'getAll', 'put', 'add', 'delete', 'clear', 'count').
    * @param {boolean} readOnly - Indicates whether the transaction is read-only.
    * @param {string|Array|object} [param] - The key or data to use in the query.
    * @returns {Promise<any>} A promise that resolves with the query result.
    */

        const _query = (method, readOnly, param = null) =>
            new Promise((resolveQuery, rejectQuery) => {
                const permission = readOnly ? 'readonly' : 'readwrite';
                if (db.objectStoreNames.contains(storeName)) {
                    const transaction = db.transaction(storeName, permission);
                    const store = transaction.objectStore(storeName);
                    const isMultiplePut = method === 'put' && param &&
                        typeof param.length !== 'undefined';
                    let listener;
                    if (isMultiplePut) {
                        listener = transaction;
                        param.forEach((entry) => {
                            store.put(entry);
                        });
                    } else {
                        listener = store[method](param);
                    }
                    listener.oncomplete = (event) => {
                        resolveQuery(event.target.result);
                    };
                    listener.onsuccess = (event) => {
                        resolveQuery(event.target.result);
                    };
                    listener.onerror = (event) => {
                        rejectQuery(event);
                    };
                } else {
                    rejectQuery(new Error('Store not found'));
                }
            });

        const methods = {
            /**
          * Retrieves an entry from the object store using the provided key.
          * @param {string} keyToUse - The key of the entry to retrieve.
          * @returns {Promise<any>} A promise that resolves with the retrieved entry.
            */

            getEntry: keyToUse => _query('get', true, keyToUse),

            /**
           * Retrieves all entries from the object store.
           * @returns {Promise<any[]>} A promise that resolves with an array of all entries.
           */

            getAll: () => _query('getAll', true),

            /**
         * Inserts or updates an entry in the object store.
         * @param {string|object} entryData - The data to insert or update.
         * @returns {Promise<any>} A promise that resolves with the updated entry.
         */

            put: entryData => _query('put', false, entryData),

            /**
              * Inserts or updates an entry in the object store.
              * @param {string|object} entryData - The data to insert or update.
              * @returns {Promise<any>} A promise that resolves with the updated entry.
              */

            add: entryData => _query('put', false, entryData),


            /**
             * Deletes an entry from the object store using the provided key.
             * @param {string} keyToUse - The key of the entry to delete.
             * @returns {Promise<void>} A promise that resolves when the entry is deleted.
             */

            deleteEntry: keyToUse => _query('delete', false, keyToUse),

            /**
           * Deletes all entries in the object store.
           * @returns {Promise<void>} A promise that resolves when all entries are deleted.
           */

            deleteAll: () => _query('clear', false),

            /**
           * Deletes all entries in the object store.
           * @returns {Promise<void>} A promise that resolves when all entries are deleted.
           */

            flush: () => _query('clear', false),
            
            /**
        * Counts the number of entries in the object store.
        * @returns {Promise<number>} A promise that resolves with the count of entries.
        */
            count: () => _query('count', true)
        };

        const _successOnBuild = () => {
            db = openDBRequest.result;
            resolve(methods);
        };

        const _errorOnBuild = (e) => {
            reject(new Error(e));
        };

        openDBRequest.onupgradeneeded = _upgrade.bind(this);
        openDBRequest.onsuccess = _successOnBuild.bind(this);
        openDBRequest.onerror = _errorOnBuild.bind(this);
    });

};




export default DB;
