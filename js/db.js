/**
 * db.js —— IndexedDB 封装
 * 库名 nameApp，4 个 store：records / favorites / materials / settings
 * 提供增删改查、清空、导出/导入备份。
 * 兼容浏览器(全局 App.DB)与 Node(module.exports)。
 */
(function (global) {
  'use strict';

  const App = global.App = global.App || {};

  const DB_NAME = 'nameApp';
  const DB_VERSION = 1;
  const STORES = {
    records: { keyPath: 'id', indexes: ['module', 'createdAt'] },
    favorites: { keyPath: 'id', indexes: ['module', 'createdAt'] },
    materials: { keyPath: 'id', indexes: ['createdAt'] },
    settings: { keyPath: 'key' }
  };

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!global.indexedDB) {
        reject(new Error('当前环境不支持 IndexedDB'));
        return;
      }
      const req = global.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        const db = e.target.result;
        for (const name of Object.keys(STORES)) {
          if (!db.objectStoreNames.contains(name)) {
            const cfg = STORES[name];
            const store = db.createObjectStore(name, { keyPath: cfg.keyPath });
            (cfg.indexes || []).forEach(function (idx) {
              store.createIndex(idx, idx);
            });
          }
        }
      };
      req.onsuccess = function (e) {
        const db = e.target.result;
        db.onversionchange = function () { db.close(); };
        resolve(db);
      };
      req.onerror = function (e) {
        reject(e.target && e.target.error ? e.target.error : new Error('打开数据库失败'));
      };
    });
    return dbPromise;
  }

  function tx(db, store, mode, fn) {
    return new Promise(function (resolve, reject) {
      try {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const req = fn(s);
        t.oncomplete = function () {
          let out;
          try { out = req && typeof req.result !== 'undefined' ? req.result : undefined; }
          catch (e) { out = undefined; }
          resolve(out);
        };
        t.onerror = function (e) {
          reject(e.target && e.target.error ? e.target.error : new Error('事务失败'));
        };
        t.onabort = function (e) {
          reject(e.target && e.target.error ? e.target.error : new Error('事务中止'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  const DB = {};

  DB.add = function (store, obj) {
    return openDB().then(function (db) {
      return tx(db, store, 'readwrite', function (s) { return s.add(obj); });
    });
  };

  DB.put = function (store, obj) {
    return openDB().then(function (db) {
      return tx(db, store, 'readwrite', function (s) { return s.put(obj); });
    });
  };

  DB.get = function (store, id) {
    return openDB().then(function (db) {
      return tx(db, store, 'readonly', function (s) { return s.get(id); });
    });
  };

  DB.delete = function (store, id) {
    return openDB().then(function (db) {
      return tx(db, store, 'readwrite', function (s) { return s.delete(id); });
    });
  };

  DB.clear = function (store) {
    return openDB().then(function (db) {
      return tx(db, store, 'readwrite', function (s) { return s.clear(); });
    });
  };

  DB.getAll = function (store) {
    return openDB().then(function (db) {
      return tx(db, store, 'readonly', function (s) { return s.getAll(); });
    });
  };

  /**
   * 按索引查询
   * @param {string} store
   * @param {string} index 索引名
   * @param {any} value
   */
  DB.getByIndex = function (store, index, value) {
    return openDB().then(function (db) {
      return tx(db, store, 'readonly', function (s) {
        return s.index(index).getAll(value);
      });
    });
  };

  /**
   * 导出全部用户数据为纯 JSON 对象（不含内置库）
   */
  DB.exportAll = async function () {
    const data = { version: 1, exportedAt: App.now(), stores: {} };
    for (const name of Object.keys(STORES)) {
      data.stores[name] = await DB.getAll(name);
    }
    return data;
  };

  /**
   * 导入备份：校验结构后清空各 store 并重建
   */
  DB.importAll = async function (json) {
    if (!json || json.version !== 1 || !json.stores || typeof json.stores !== 'object') {
      throw new Error('备份文件格式不正确');
    }
    for (const name of Object.keys(STORES)) {
      const list = Array.isArray(json.stores[name]) ? json.stores[name] : [];
      await DB.clear(name);
      for (const obj of list) {
        await DB.put(name, obj);
      }
    }
    return { ok: true, stores: Object.keys(STORES) };
  };

  App.DB = DB;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
