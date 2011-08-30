
/**
 * @class lsdb
 * LSDb Local Storage Database and ORM
 */                                                                                                

function lsdb(config) {

        this._default_pattern = '[dbname]_[table]_[field]_[id]';
                                  
        /**
         * Connect to the database. If there is no support for the LocalStorage, "NoLocalStorage" error will be thrown.
         * @cfg {String} dbname Database name 
         * @cfg {Boolean} debug True to run in the debug mode
         */

        this.connect = function( config ) {
        
            if (!window.localStorage)
                throw('NoLocalStorage');

            this.dbname = config.dbname, this.debug = config.debug, this.ls = localStorage;
            if (this.debug)
                console.log('Connected to "' + this.dbname + '"');

        }

        this._parse = function( key ) {

        }

        /**
         * Returns all databases as array of names.
         * @return {Array of Strings} Databases list
         */

        this.show_databases = function() {
            var dbs = [], utils = this.utils, ls = this.ls;
            var cb = function(key) {
                var tmp = key.split('_'), dbname = tmp[0];
                if (dbname)
                    dbs.push(dbname);
                else
                    dbs.push('undefined');
            }
            utils.browse_ls(ls, cb);
            return utils.array_unique(dbs);
        }

        /**
         * Returns all tables from the connected databases as array of names.
         * @return {Array of Strings} Tables list
         */

        this.show_tables = function() {
            var tbs = [], dbname = this.dbname, utils = this.utils, ls = this.ls;
            var cb = function(key) {
                if (key) {
                    var tmp = key.split('_'), dbn = tmp[0], tbname = tmp[1];
                    if (dbn == dbname) {
                        if (tbname)
                            tbs.push(tbname);
                        else
                            tbs.push('undefined');
                    }
                }
            }
            utils.browse_ls(ls, cb);
            return utils.array_unique(tbs);
        }

        /**
         * Inserts one or several records into the table <br/>
         * Example: db.insert('users', { name: 'John', surname: 'Doe' });<br/>
         * db.insert('users', [ { name: 'Engerberd', surname: 'Humperdink' }, { name: 'Glass', surname: 'Yage' } ]);<br/>
         * @params {String} table Table name
         * @params {Object} or {Array of Objects} data Record(s) data
         * @return {Int} or {Array of Ints} New record(s) autoincrement ID(s) (starting from 1)
         */

        this.insert = function(table, data) {

            var ls = this.ls, table_props = this.dbname + '_' + table, rec = '', ids = [], id = 0;

            if (!data[0]) 
                data = [ data ];

            for (var i=0,ii=data.length; i<ii; i++) {
                id = data[i].id || parseInt(ls[ table_props + '_id']) || 1;
                for (var field in data[i]) {
                    rec = table_props + '_' + id;
                    ls[rec + '_' + field] = data[i][field];    
                }
                ls[rec + '_id'] = id;
                ls[table_props + '_id'] = id + 1;
                ids.push(id);
            }

            if (ids.length == 1)
                return ids[0];
            else
                return ids;

        }

        /**
         * Browses all tables in the database and calls callback for the each record<br/>
         * Callback will be called with record's fields id, field and value <br/>
         * If callback returns true, id of the record will be added to return array
         * @params {String} table Table name
         * @params {Function} callback Callback function
         * @return {Array of Integer} Array of IDs for matched records
         */

        this.table_each = function(table, callback) {

            var ls = this.ls, table_props = this.dbname + '_' + table; 
            var ids = [];

            if (ls[table_props + '_id']) {
                for (var i=0,ii=ls.length; i<ii; i++) {
                    var k = ls.key(i);
                    if (k.indexOf(table_props) == 0) {
                        var reg = k.replace(table_props + '_', '').match(/(\d+)\_(.*)/);
                        if (reg && reg[1] && reg[2]) {
                            var id = parseInt(reg[1]);
                            var field = reg[2];
                            var value = (field == 'id')? parseInt(ls[k]): ls[k];
                            var res = callback(id, field, value);
                            if (res) {
                                ids.push(id);
                                ls[k] = res;
                            }
                        }
                    }
                }
                return ids;
            }
            else                  
                return false;

        }

        /**
         * Returns all records from the table as object or as array<br/>
         * @params {String} table Table name
         * @params {String} mode Can be 'array' or 'object'.  
         * @return {Mixed} Records in format, specified by the mode param
         */

        this.select_all = function(table, mode) {

            var db = this, els = {};
            var cb = function(id, field, value) {
                if (!els[id])
                    els[id] = {};
                els[id][field] = value;
            }

            db.table_each( table, cb );

            if (mode == 'array' || mode == 'as_array') {
                var res_array = [];
                for (var id in els) {
                    res_array.push(els[id]);
                }
                els = res_array;
            }
            
            return els;

        }

        /**
         * Returns records from the table as object or as array, filtered by reduce callback<br/>
         * Reduce callback will be called for the each record with record as parameter <br/>
         * If callback returns true, record will be added to returned array <br/>
         * Example: db.select('users', 3); // will return User with ID=3 <br/>
         * db.select('users', function(rec) { if (rec.age > 17) return true }); // will return all Users whose age is higher than 17 <br/>
         * @params {String} table Table name
         * @params {Mixed} reduce Reduce callback function. If passed ID or array of IDs instead of the callback, <br/>
         * function will return records with matched IDs
         * @params {String} mode Can be 'array' or 'object'.  
         * @return {Mixed} Record(s) in format, specified by the mode param
         */

        this.select = function(table, reduce, mode) {

            var ls = this.ls, table_props = this.dbname + '_' + table, utils = this.utils; 

            var els = this.select_all(table), res = {};

            if (!reduce)
                res = els;
            else {
                if (reduce && (typeof reduce=='string' || typeof reduce=='number')) { /* if reduce == id */
                    var reduce_id = parseInt(reduce);
                    reduce = function(rec) { if (rec.id == reduce_id) return true; else return false; }
                }
                else if (reduce && reduce[0]) { /* if array of ids */
                    var reduce_ids = reduce;
                    reduce = function(rec) { if (utils.inArray(reduce_ids, rec.id)) return true; else return false; }
                }
            }

            for (var id in els) {
                if (reduce(els[id])) {
                    res[id] = els[id];
                }
            }

            var keys = utils.getKeys(res);
            if (keys.length == 1 && mode!='array' && mode!='object')
                res = res[keys[0]];

            if (mode == 'array') {
                var res_array = [];
                for (var id in res) {
                    res_array.push(res[id]);
                }
                res = res_array;
            }

            return res;

        }

        /**
         * Update record(s) with the new values<br/>
         * @params {String} table Table name
         * @params {Mixed} reduce Reduce callback function. If passed ID or array of IDs instead of the callback, <br/>
         * function will return records with matched IDs
         * @params {Object} dataObj Object containing new fields
         * @return {Int} or {Array of Ints} Updated record(s) ID(s) 
         */

        this.update = function(table, dataObj, reduce) {
        
            function dehydrate(object) {              
                var key = 'id';
                if (typeof object == 'object' && object[key]) {
                    return object[key];
                }
                else if (typeof object == 'object' && object.length > 0) {
                    for (var i=0, ii=object.length; i<ii; i++) {
                        object[i] = dehydrate(object[i]);
                    }
                    return object;
                }
                else 
                    return object;
            }

            var ls = this.ls, table_props = this.dbname + '_' + table, utils = this.utils, ids = [];

            var els = this.select(table, reduce, 'array');

            for (var i=0,ii=els.length; i<ii; i++) {
                var id = els[i].id, 
                    rec = table_props + '_' + id,
                    updated = utils.objMerge(els[i], dataObj);

                for (var field in updated) {
                    ls[rec + '_' + field] = dehydrate(updated[field]);
                }

                ids.push[id];
            }

            if (ids.length == 1)
                return ids[0];
            else
                return ids;

        }

        /**
         * Removes records from the table, returned by the reduce callback<br/>
         * Reduce callback will be called for the each record with the record as parameter <br/>
         * If callback returns true, record will be removed <br/>
         * Example: db.remove('users', 3); // will remove User with ID=3 <br/>
         * db.remove('users', function(rec) { if (rec.age > 17) return true }); // will remove all Users whose age is higher than 17 <br/>
         * @params {String} table Table name
         * @params {Mixed} reduce Reduce callback function. If passed numeric ID or array of IDs instead of the callback, <br/>
         * function will return records with matched IDs
         */

        this.remove = function(table, reduce) {
            var ls = this.ls, table_props = this.dbname + '_' + table, utils = this.utils;
            var recs = db.select(table, reduce, 'object');
            var ids = utils.map(utils.getKeys(recs), function(id) { return table_props + '_' + id; });
            var keys_to_remove = [];
            for (var i=0,ii=ls.length; i<ii; i++) {
                var key = ls.key(i);
                for (var j=0,jj=ids.length; j<jj; j++) {
                    if (key && key.indexOf(ids[j]) == 0) {
                        keys_to_remove.push(key);
                    }
                }
            }
            for (var i=0,ii=keys_to_remove.length; i<ii; i++) {
                ls.removeItem(keys_to_remove[i]);
            }
        } 

        /**
         * Drops the table, removes all its records. Alternative name is "drop_table"
         * @params {String} table Table name
         */

        this.drop = function(table) {
            var ls = this.ls, table_props = this.dbname + '_' + table, keys_to_remove = [];
            for (var i=0,ii=ls.length; i<ii; i++) {
                var key = ls.key(i);
                if (key && key.indexOf(table_props) == 0) {
                    keys_to_remove.push(key);
                }
            }
            for (var i=0,ii=keys_to_remove.length; i<ii; i++) {
                ls.removeItem(keys_to_remove[i]);
            }
        }

        this.drop_table = this.drop;

        /**
         * Connect to the ORM layer. 
         * @cfg {Object} models Models configuration. 
         */

        this.orm_init = function(conf) {
            var db = this;
            db.conf_orm = conf;
            return true;
        }

        /**
         * Saves one or several record(s)<br/>
         * @params {Model} model Model name (from the ORM config, see {link orm_init})
         * @params {Object} or {Array of Objects} data Record(s) data
         * @return {Int} or {Array of Ints} New record(s) ID(s) 
         */

        this.orm_save = function(model, data) {

            var table = model.table,
                        params = { table: model.table, model: model, data: data },
                        db = this, conf = db.conf_orm, models = conf.models, ids = [];

            if (data) {

                if (!data[0])
                    data = [ data ];

                for (var i=0,ii=data.length; i<ii; i++) {

                    var dataObj = {};
                    var fields = model.fields.concat(['fid']);

                    if (model.associations) {
                        for (var k=0,kk=model.associations.length; k<kk; k++) {
                            var assoc = model.associations[k];
                                fields.push(assoc.name);
                        }
                    }

                    for (var field in fields) {
                        if (data[i][fields[field]]) {
                            dataObj[fields[field]] = data[i][fields[field]];
                        }
                    }

                    if (dataObj.id) {
                        var id = db.update(table, dataObj, dataObj.id);
                    }
                    else if (dataObj.fid) {
                        dataObj.id = dataObj.fid;
                        var id = db.insert(table, dataObj);
                    }
                    else {
                        var id = db.insert(table, dataObj);
                    }

                    ids.push(parseInt(id));

                }


            }

            return (ids.length == 1)? ids[0]: ids;

        }

        /**
         * Loads model instance(s) as object or as array, filtered by reduce callback<br/>
         * Record(s) will be loaded recursively will all its associated records<br/>
         * Reduce callback will be called for the each record with record as parameter <br/>
         * If callback returns true, record will be added to returned array <br/>
         * Example: db.orm_load('User', 3); // will return User with ID=3 <br/>
         * db.orm_load('User', function(rec) { if (rec.age > 17) return true }); // will return all Users whose age is higher than 17 <br/>
         * @params {Model} model Model name (from the ORM config, see {link orm_init})
         * @params {Mixed} reduce Reduce callback function. If passed ID or array of IDs instead of the callback, <br/>
         * function will return records with matched IDs
         * @params {String} mode Can be 'array' or 'object'.  
         * @return {Mixed} Record(s) in format, specified by the mode param
         */

        this.orm_load = function(model, reduce, mode, _nesting_table) {

            var table = model.table, db = this, utils = this.utils, conf = db.conf_orm, models = conf.models;

            var data = db.select(table, reduce, 'object');

            if (!_nesting_table)
                _nesting_table = {};

            if (model.associations) {

                for (var k = 0, kk = model.associations.length; k < kk; k++) {
                
                    var assoc = model.associations[k],
                        l_model = models[assoc.model],
                        localKey = assoc.localKey, 
                        foreignKey = assoc.foreignKey;

                    if (assoc.type == 'hasMany') {
                        var ids = utils.getKeys(data);
                    }
                    else if (assoc.type == 'hasOne') {
                        var ids = [];                                
                        for (var id in data) {
                            ids.push(data[id][assoc.name]);
                        }
                    }

                    var reduce = function(rec) { 
                        if (utils.inArray(ids, rec[foreignKey])) 
                            return true; 
                    };

                    var nesting = utils.get_combination(_nesting_table, l_model.table, assoc.type);

                    if (nesting) {
                        var els = db.select(l_model.table, reduce, 'object');
                    }
                    else {
                        utils.set_combination(_nesting_table, l_model.table, assoc.type);
                        var els = db.orm_load(l_model, reduce, 'object', _nesting_table);
                    }                    

                    if (assoc.type == 'hasMany') {

                        if (assoc.foreignKey) {       // 1:m

                            if (els) {
                                var els_by_key = {};
                                for (var id in els) {
                                    if (els.hasOwnProperty(id)) {
                                        var el = els[id];
                                        if (!els_by_key[el[foreignKey]['id']])
                                            els_by_key[el[foreignKey]['id']] = [];
                                        els_by_key[el[foreignKey]['id']].push(els[id]);    
                                    }
                                }
                                for (var id in data) {
                                    if (els_by_key[id])
                                        data[id][assoc.name] = els_by_key[id]
                                }
                            }
                        }
                        else {                  // m:m

                            for (var id in data) {
                                var ids = data[id][assoc.name];

                                if (ids) {
                                    if (ids.indexOf(',')>0) {
                                        ids = ids.split(',');
                                    }
                                    else {
                                        ids = [ids];
                                    }
                                    var els = db.select(l_model.table, function(rec) { 
                                        if (utils.inArray(ids, rec['id'])) 
                                            return true; 
                                    }, 'array');
                                    data[id][assoc.name] = els;
                                }
                            }
                        }
                        
                    }

                    if (assoc.type == 'hasOne') {

                        if (els) {
                            for (var id in data) {
                                var el = data[id];
                                if (els[el[localKey]]) {
                                    data[id][assoc.name] = els[el[localKey]];
                                }
                            }
                        }
                    }

                }
            }

            var keys = utils.getKeys(data);
            
            if (keys.length == 1 && mode!='object') {
                data = data[keys[0]];
                data.model = model;
            }
            else 
                for (var key in data) {
                    data[key]['model'] = model;
                }

            if (mode == 'array') {
                var arr = [];
                for (var key in data) {
                    arr.push(data[key]);
                }
                data = arr;
            }

            return data;

        }

        this.orm_remove = function(record) {
            var db = this;
            if (record.model && record.id > 0) {
                db.remove(record.model.table, record.id);
            }
                
        }

        this.connect(config);

        this.utils = {};

        /**
         * Browses LocalStorage and calls callback function on each element
         * @param {LocalStorage} ls LocalStorage
         * @param {Function} callback Callback (Mixed key, Mixed value)
         */

        this.utils.browse_ls = function ( ls, callback ) {

            for (var i=0,ii=ls.length; i<ii; i++) {
                var k = ls.key(i);
                callback(k, ls.k);
            }

        }

        /**
         * Returns keys of the passed object
         * @param {Object} obj Object
         * @return {Array} Keys
         */

        this.utils.getKeys = function(obj) {
           var keys = [];
           for (var key in obj){
              keys.push(key);
           }
           return keys;
        }

        /**
         * Simple merge of two objects 
         * @return {Object} Merged object
         */

        this.utils.objMerge = function(obj1, obj2) {
            for (var field in obj2)
                obj1[field] = obj2[field];
            return obj1;
        }

        /**
         * Converts function arguments object into array
         * @return {Array} Arguments array
         */

        this.utils.args2arr = function(args) {
            var arr = [];
            for (var i=0,ii=args.length; i<ii; i++) {
                arr.push(args[i]);
            }
            return arr;
        }

        this.utils._combination = function( table, args, mode ) { 
            var arr = this.args2arr(args);
            var fields = arr.slice(1, arr.length);
            key = fields.join('.');
            if (mode == 'set')
                table[key] = true;
            else if (mode == 'get') {
                if (table[key])
                    return table[key];
                else
                    return false;
            }
        }

        /**
         * Get multiple flags combination. Example: <br/>
         * var flag; <br/>
         * utils.set_combination( flag, 'one', two ); <br/>
         * utils.get_combination( flag, 'one', two ); // = TRUE
         * utils.get_combination( flag, 'one' ) // = FALSE
         * @return {Boolean} Result
         */

        this.utils.get_combination = function( table ) { 
            return this._combination( table, arguments, 'get' );
        }

        /**
         * Set multiple flags combination. Example: <br/>
         * var flag; <br/>
         * utils.set_combination( flag, 'one', two ); <br/>
         * utils.get_combination( flag, 'one', two ); // = TRUE
         * utils.get_combination( flag, 'one' ) // = FALSE
         */

        this.utils.set_combination = function( table ) { 
            this._combination( table, arguments, 'set' );
        }

        /**
         * Returns true if value is in array<br/>
         * @param {Array} arr Tested array
         * @param {Mixed} value Tested value
         * @return {Boolean} Result
         */

        this.utils.inArray = function(arr, value) {
            if (arr && arr.length) {
                var res = false, i=0;
                while (i < arr.length && !res) {
                    if (arr[i] == value)
                        res = true;
                    i++;
                }
                return res;
            }
            else 
                return false;
        }

        /**
         * Go through the array, translating each of the items to their new value (or values).
         * @param {Array} elems Array
         * @param {Function} callback Callback function
         * @return {Boolean} New mapped array
         */

	this.utils.map = function( elems, callback ) {
            var ret = [], value;

            for ( var i = 0, length = elems.length; i < length; i++ ) {
                value = callback( elems[ i ], i );

                if ( value != null ) {
                    ret[ ret.length ] = value;
                }
            }

            return ret.concat.apply( [], ret );
	}

        /**
         * Go through the array, removing duplicated values
         * @param {Array} elems Array
         * @return {Array} New array with unique values
         */

        this.utils.array_unique = function( elems ) {
            var a = [], i, l = elems.length;
            for( i=0; i<l; i++ ) {
                if( a.indexOf( elems[i], 0 ) < 0 ) { a.push( elems[i] ); }
            }
            return a;
        };

};


