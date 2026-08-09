import { initSuggestions } from './suggestions.js';
import { initVoice } from './voice.js';
import { applyBang } from './bangs.js';
import { API_URL } from './api.js';

const homeInput = document.getElementById('home-q');
if (homeInput) {
  initSuggestions(homeInput);
  initVoice(homeInput);

  const form = homeInput.form;
  if (form) {
    form.addEventListener('submit', function (event) {
      const bang = applyBang(homeInput.value);
      if (!bang) return;
      event.preventDefault();
      if (bang.redirect) {
        window.location.href = bang.redirect;
      } else {
        const params = new URLSearchParams();
        params.set('q', bang.query);
        params.set('type', bang.type);
        window.location.href = 'search.html?' + params.toString();
      }
    });
  }
}

const clearButton = document.getElementById('clear-cache');
if (clearButton) {
  clearButton.addEventListener('click', function () {
    clearButton.disabled = true;
    fetch(API_URL + '/api/cache/clear', { method: 'POST' })
      .then(function (response) {
        return response.json();
      })
      .then(function () {
        toast('Image cache cleared');
      })
      .catch(function () {
        toast("Couldn't reach the service");
      })
      .then(function () {
        clearButton.disabled = false;
      });
  });
}

function toast(message) {
  const el = document.createElement('div');
  el.className = 'home__toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(function () {
    el.classList.add('is-visible');
  });
  setTimeout(function () {
    el.classList.remove('is-visible');
    setTimeout(function () {
      el.remove();
    }, 300);
  }, 1800);
}
