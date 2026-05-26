// ============================================================
// Back4App (Parse) Configuration for Admin Portal
// Parse is loaded via <script> tag in HTML before this file
// This exposes a global `supabase` variable so all existing
// admin JS code works without any query changes.
// ============================================================

(function () {
  const APP_ID = 'SxhMBsTSB2BasoZQecw9KyixCwyDMK8cyQwx9T7f';
  const JS_KEY = 'oFVQJKq96RoamUqC6EfbPdnIJBlA5V4ii6ZF6riF';

  if (typeof Parse === 'undefined') {
    console.error('❌ Parse is not loaded. Make sure the Parse CDN script tag is in your HTML before config/back4app.js');
    return;
  }

  Parse.initialize(APP_ID, JS_KEY);
  Parse.serverURL = 'https://parseapi.back4app.com/';
  console.log('✅ Back4App (Parse) admin client initialized');

  // ----------------------------------------------------------
  // CLASS NAME MAP
  // Maps Supabase table names to Parse class names.
  // 'students' maps to '_User' (Parse built-in user class).
  // ----------------------------------------------------------
  const CLASS_MAP = {
    'students': '_User',
    'student_info': 'StudentInfo',
    'schedules': 'Schedules'
    // all other names map to themselves
  };

  function getClassName(tableName) {
    return CLASS_MAP[tableName] || tableName;
  }

  // ----------------------------------------------------------
  // QUERY BUILDER
  // Supports: select, eq, neq, gte, lte, gt, lt, or,
  //           order, limit, single, maybeSingle
  // ----------------------------------------------------------
  function ParseQueryBuilder(className) {
    this.className = className;
    this._filters = [];
    this._orConditions = null;
    this._order = null;
    this._ascending = true;
    this._limit = 1000;
    this._single = false;
    this._maybeSingle = false;
    this._countOnly = false;
    this._selectFields = '*';
  }

  ParseQueryBuilder.prototype.select = function (fields) {
    this._selectFields = fields || '*';
    // Detect count queries: select('*', { count: 'exact', head: true })
    if (arguments[1] && arguments[1].count === 'exact') {
      this._countOnly = true;
    }
    return this;
  };

  ParseQueryBuilder.prototype.eq = function (field, value) {
    this._filters.push({ type: 'eq', field: field, value: value });
    return this;
  };

  ParseQueryBuilder.prototype.neq = function (field, value) {
    this._filters.push({ type: 'neq', field: field, value: value });
    return this;
  };

  ParseQueryBuilder.prototype.gte = function (field, value) {
    this._filters.push({ type: 'gte', field: field, value: value });
    return this;
  };

  ParseQueryBuilder.prototype.lte = function (field, value) {
    this._filters.push({ type: 'lte', field: field, value: value });
    return this;
  };

  ParseQueryBuilder.prototype.gt = function (field, value) {
    this._filters.push({ type: 'gt', field: field, value: value });
    return this;
  };

  ParseQueryBuilder.prototype.lt = function (field, value) {
    this._filters.push({ type: 'lt', field: field, value: value });
    return this;
  };

  ParseQueryBuilder.prototype.or = function (conditionString) {
    this._orConditions = conditionString;
    return this;
  };

  ParseQueryBuilder.prototype.order = function (field, options) {
    this._order = field;
    this._ascending = !options || options.ascending !== false;
    return this;
  };

  ParseQueryBuilder.prototype.limit = function (n) {
    this._limit = n;
    return this;
  };

  ParseQueryBuilder.prototype.single = function () {
    this._single = true;
    this._limit = 1;
    return this;
  };

  ParseQueryBuilder.prototype.maybeSingle = function () {
    this._maybeSingle = true;
    this._limit = 1;
    return this;
  };

  ParseQueryBuilder.prototype._buildQuery = function () {
    var query = new Parse.Query(this.className);

    this._filters.forEach(function (f) {
      switch (f.type) {
        case 'eq': query.equalTo(f.field, f.value); break;
        case 'neq': query.notEqualTo(f.field, f.value); break;
        case 'gte': query.greaterThanOrEqualTo(f.field, f.value); break;
        case 'lte': query.lessThanOrEqualTo(f.field, f.value); break;
        case 'gt': query.greaterThan(f.field, f.value); break;
        case 'lt': query.lessThan(f.field, f.value); break;
      }
    });

    if (this._orConditions) {
      var parts = this._orConditions.split(',');
      var self = this;
      var orQueries = parts.map(function (part) {
        var sub = new Parse.Query(self.className);
        // Apply base filters to each sub-query
        self._filters.forEach(function (f) {
          if (f.type === 'eq') sub.equalTo(f.field, f.value);
          if (f.type === 'neq') sub.notEqualTo(f.field, f.value);
          if (f.type === 'gte') sub.greaterThanOrEqualTo(f.field, f.value);
          if (f.type === 'lte') sub.lessThanOrEqualTo(f.field, f.value);
        });
        var match = part.trim().match(/^(\w+)\.(eq|neq|gte|lte|gt|lt)\.(.+)$/);
        if (match) {
          var field = match[1], op = match[2], value = match[3];
          if (op === 'eq') sub.equalTo(field, value);
          else if (op === 'neq') sub.notEqualTo(field, value);
          else if (op === 'gte') sub.greaterThanOrEqualTo(field, value);
          else if (op === 'lte') sub.lessThanOrEqualTo(field, value);
        }
        return sub;
      });
      return Parse.Query.or.apply(Parse.Query, orQueries);
    }

    if (this._order) {
      if (this._ascending) query.ascending(this._order);
      else query.descending(this._order);
    }

    query.limit(this._limit);
    return query;
  };

  ParseQueryBuilder.prototype._toRow = function (obj) {
    if (!obj) return null;
    var json = obj.toJSON();
    return Object.assign({ id: json.objectId }, json);
  };

  ParseQueryBuilder.prototype.then = function (resolve, reject) {
    var self = this;
    var promise = (async function () {
      try {
        var query = self._buildQuery();

        if (self._countOnly) {
          var count = await query.count();
          return { count: count, data: null, error: null };
        }

        if (self._single || self._maybeSingle) {
          var result = await query.first();
          if (self._single && !result) {
            return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
          }
          return { data: result ? self._toRow(result) : null, error: null };
        }

        var results = await query.find();
        return { data: results.map(function (r) { return self._toRow(r); }), error: null };
      } catch (err) {
        console.error('Parse query error on ' + self.className + ':', err);
        return { data: null, error: err };
      }
    })();
    return promise.then(resolve, reject);
  };

  // ----------------------------------------------------------
  // MUTATION BUILDER
  // Supports: insert, update, delete, upsert + .eq() filters
  // ----------------------------------------------------------
  function ParseMutationBuilder(className, operation, payload) {
    this.className = className;
    this.operation = operation;
    this.payload = payload;
    this._filters = [];
  }

  ParseMutationBuilder.prototype.eq = function (field, value) {
    this._filters.push({ field: field, value: value });
    return this;
  };

  ParseMutationBuilder.prototype.select = function () { return this; };
  ParseMutationBuilder.prototype.single = function () { return this; };

  ParseMutationBuilder.prototype.then = function (resolve, reject) {
    var self = this;
    var promise = (async function () {
      try {
        var ParseClass = Parse.Object.extend(self.className);

        if (self.operation === 'insert') {
          var items = Array.isArray(self.payload) ? self.payload : [self.payload];
          var objects = items.map(function (item) {
            var obj = new ParseClass();
            Object.keys(item).forEach(function (k) { obj.set(k, item[k]); });
            return obj;
          });
          await Parse.Object.saveAll(objects);
          return { data: objects.map(function (o) { return Object.assign({ id: o.id }, o.toJSON()); }), error: null };
        }

        if (self.operation === 'update' || self.operation === 'delete') {
          var query = new Parse.Query(self.className);
          self._filters.forEach(function (f) { query.equalTo(f.field, f.value); });
          query.limit(1000);
          var results = await query.find();

          if (self.operation === 'delete') {
            await Parse.Object.destroyAll(results);
            return { data: null, error: null };
          }

          results.forEach(function (obj) {
            Object.keys(self.payload).forEach(function (k) { obj.set(k, self.payload[k]); });
          });
          await Parse.Object.saveAll(results);
          return { data: results.map(function (o) { return Object.assign({ id: o.id }, o.toJSON()); }), error: null };
        }

        if (self.operation === 'upsert') {
          var upsertQuery = new Parse.Query(self.className);
          self._filters.forEach(function (f) { upsertQuery.equalTo(f.field, f.value); });
          var existing = await upsertQuery.first();
          var upsertObj = existing || new ParseClass();
          var upsertItem = Array.isArray(self.payload) ? self.payload[0] : self.payload;
          Object.keys(upsertItem).forEach(function (k) { upsertObj.set(k, upsertItem[k]); });
          await upsertObj.save();
          return { data: Object.assign({ id: upsertObj.id }, upsertObj.toJSON()), error: null };
        }

        return { data: null, error: new Error('Unknown operation: ' + self.operation) };
      } catch (err) {
        console.error('Parse mutation error on ' + self.className + ':', err);
        return { data: null, error: err };
      }
    })();
    return promise.then(resolve, reject);
  };

  // ----------------------------------------------------------
  // TABLE REF
  // ----------------------------------------------------------
  function ParseTableRef(tableName) {
    this.className = getClassName(tableName);
  }

  ParseTableRef.prototype.select = function (fields, options) {
    var q = new ParseQueryBuilder(this.className);
    return q.select(fields, options);
  };

  ParseTableRef.prototype.insert = function (payload) {
    return new ParseMutationBuilder(this.className, 'insert', payload);
  };

  ParseTableRef.prototype.update = function (payload) {
    return new ParseMutationBuilder(this.className, 'update', payload);
  };

  ParseTableRef.prototype.delete = function () {
    return new ParseMutationBuilder(this.className, 'delete', null);
  };

  ParseTableRef.prototype.upsert = function (payload) {
    return new ParseMutationBuilder(this.className, 'upsert', payload);
  };

  // ----------------------------------------------------------
  // STORAGE STUB (Back4App uses Parse Files)
  // ----------------------------------------------------------
  var storageCompat = {
    from: function (bucket) {
      return {
        upload: async function (path, file) {
          try {
            var fileName = path.split('/').pop();
            var parseFile = new Parse.File(fileName, file);
            await parseFile.save();
            return { data: { path: path, url: parseFile.url() }, error: null };
          } catch (err) {
            return { data: null, error: err };
          }
        },
        getPublicUrl: function (path) {
          return { data: { publicUrl: '' } };
        },
        remove: async function (paths) {
          // Back4App file deletion requires the file object — stub returns success
          console.warn('Storage remove: file deletion from Back4App requires the Parse File object. Path:', paths);
          return { data: null, error: null };
        }
      };
    }
  };

  // ----------------------------------------------------------
  // AUTH STUB
  // ----------------------------------------------------------
  var authCompat = {
    getSession: async function () {
      return { data: { session: null }, error: null };
    },
    signOut: async function () {
      try { await Parse.User.logOut(); } catch (e) { /* ignore */ }
      return { error: null };
    }
  };

  // ----------------------------------------------------------
  // GLOBAL SUPABASE-COMPATIBLE CLIENT
  // All existing admin JS code uses `supabase.from(...)` —
  // this replaces window.supabase.createClient() output.
  // ----------------------------------------------------------
  window.supabase = {
    from: function (tableName) {
      return new ParseTableRef(tableName);
    },
    storage: storageCompat,
    auth: authCompat
  };

  console.log('✅ Admin supabase-compatible wrapper ready (powered by Back4App)');
})();
