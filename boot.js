// Se carga en <head> antes de pintar. Está en un archivo aparte (y no dentro de index.html)
// porque la política de seguridad (CSP, en vercel.json) no permite scripts en línea.

// Aplica tema y fondo antes de pintar (evita un destello del tema equivocado)
try {
  var d = JSON.parse(localStorage.getItem('micomunidad:display') || '{}');
  var light = d.theme === 'light' || (d.theme !== 'dark' && matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  document.documentElement.dataset.wall = d.wall || 'cielo';
} catch (e) {}

// Vercel Web Analytics: sin cookies; solo visitas y las secciones que se abren. Se quita de la
// dirección todo lo que va tras ? o # (p. ej. el código de la comunidad) para que nunca se envíe.
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
window.va('beforeSend', function (e) { return Object.assign({}, e, { url: e.url.split(/[?#]/)[0] }); });

// Aviso «Gira el móvil a vertical»: solo con el móvil girado de verdad. Se mira la orientación de la
// pantalla del dispositivo, que no cambia al abrir el teclado (el tamaño de la página sí, en Android).
(function () {
  function check() {
    var small = Math.min(screen.width, screen.height) < 500; // teléfono (no tablet ni ordenador)
    var type = screen.orientation && screen.orientation.type;
    var land = type ? type.indexOf('landscape') === 0
      : typeof window.orientation === 'number' ? Math.abs(window.orientation) === 90
      : screen.width > screen.height;
    document.documentElement.classList.toggle('landscape-phone', small && land);
  }
  check();
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', check);
  window.addEventListener('orientationchange', check);
  window.addEventListener('resize', check);
})();
