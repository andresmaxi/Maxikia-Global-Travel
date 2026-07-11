/* Maxikia Global Travel — conexión con Supabase
   No edites este archivo. Tus credenciales van en config.js */
var SB = (function () {
  function url() { return (window.SUPA_URL || '').replace(/\/+$/, ''); }
  function key() { return window.SUPA_KEY || ''; }
  function enabled() { return !!(url() && key()); }
  function token() { try { return sessionStorage.getItem('sb_token') || ''; } catch (e) { return ''; } }

  function headers(auth) {
    var h = { 'apikey': key(), 'Content-Type': 'application/json' };
    h['Authorization'] = 'Bearer ' + ((auth && token()) ? token() : key());
    return h;
  }

  // ---- AUTH (solo para el panel Admin) ----
  function login(email, pass) {
    return fetch(url() + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': key(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: pass })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.access_token) {
        try { sessionStorage.setItem('sb_token', d.access_token); } catch (e) {}
        return true;
      }
      throw new Error((d && (d.error_description || d.msg)) || 'Credenciales incorrectas');
    });
  }
  function logout() { try { sessionStorage.removeItem('sb_token'); } catch (e) {} }
  function logged() { return !!token(); }

  // ---- CONTENIDO DEL SITIO (destinos + configuración) ----
  function getSite() {
    if (!enabled()) return Promise.resolve(null);
    return fetch(url() + '/rest/v1/site_data?id=eq.main&select=data', { headers: headers(false) })
      .then(function (r) { return r.json(); })
      .then(function (rows) { return (rows && rows[0] && rows[0].data) ? rows[0].data : null; })
      .catch(function () { return null; });
  }
  function saveSite(data) {
    if (!enabled()) return Promise.reject(new Error('Supabase no configurado'));
    var h = headers(true);
    h['Prefer'] = 'resolution=merge-duplicates';
    return fetch(url() + '/rest/v1/site_data', {
      method: 'POST', headers: h,
      body: JSON.stringify([{ id: 'main', data: data }])
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
      return true;
    });
  }

  // ---- RESERVAS ----
  function addReserva(obj) {
    if (!enabled()) return Promise.resolve(false);
    return fetch(url() + '/rest/v1/reservas', {
      method: 'POST', headers: headers(false), body: JSON.stringify([obj])
    }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }
  function listReservas() {
    if (!enabled()) return Promise.resolve([]);
    return fetch(url() + '/rest/v1/reservas?select=*&order=created_at.desc&limit=200', { headers: headers(true) })
      .then(function (r) { return r.json(); })
      .then(function (d) { return Array.isArray(d) ? d : []; })
      .catch(function () { return []; });
  }

  // ---- ARCHIVOS (imágenes y videos: los ven todos) ----
  function upload(file, folder) {
    if (!enabled()) return Promise.reject(new Error('Supabase no configurado'));
    var clean = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    var path = (folder || 'media') + '/' + Date.now().toString(36) + '_' + clean;
    return fetch(url() + '/storage/v1/object/media/' + path, {
      method: 'POST',
      headers: { 'apikey': key(), 'Authorization': 'Bearer ' + (token() || key()), 'x-upsert': 'true' },
      body: file
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
      return url() + '/storage/v1/object/public/media/' + path;
    });
  }

  return { enabled: enabled, login: login, logout: logout, logged: logged,
           getSite: getSite, saveSite: saveSite, addReserva: addReserva,
           listReservas: listReservas, upload: upload };
})();
