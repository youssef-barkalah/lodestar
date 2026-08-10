import { initSuggestions } from './suggestions.js';
import { initVoice } from './voice.js';
import { applyBang } from './bangs.js';

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
