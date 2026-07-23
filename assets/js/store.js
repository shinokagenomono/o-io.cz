/* ===========================
   Store — localStore wrapper
=========================== */

const Store = {

  get(key) {
    try {
      const val = localStorage.getItem('oiocz_' + key);
      return val ? JSON.parse(val) : null;
    } catch (e) { return null; }
  },

  set(key, value) {
    try {
      localStorage.setItem('oiocz_' + key, JSON.stringify(value));
      return true;
    } catch (e) { return false; }
  },

  remove(key) {
    localStorage.removeItem('oiocz_' + key);
  },

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

};