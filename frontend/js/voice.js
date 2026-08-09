function supported() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export function initVoice(input) {
  if (!supported()) return;
  const box = input.closest('.search-box');
  if (!box || box.querySelector('.search-box__voice')) return;

  const Recognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'search-box__voice';
  button.setAttribute('aria-label', 'Search by voice');
  button.setAttribute('title', 'Search by voice');
  button.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>' +
    '<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>' +
    '<line x1="12" y1="19" x2="12" y2="22"></line>' +
    '</svg>';
  box.appendChild(button);

  let recognition = null;

  function stop() {
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.stop();
    } catch (err) {}
    recognition = null;
    button.classList.remove('is-listening');
    button.setAttribute('aria-label', 'Search by voice');
  }

  function submit() {
    if (input.form) input.form.submit();
  }

  function start() {
    stop();
    recognition = new Recognition();
    recognition.lang = input.getAttribute('lang') || (document.documentElement.lang || 'en-US').replace('-', '-');
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = function (event) {
      const text = event.results[0][0].transcript;
      if (text) {
        input.value = text;
        stop();
        submit();
      }
    };
    recognition.onerror = function () {
      stop();
    };
    recognition.onend = function () {
      button.classList.remove('is-listening');
      button.setAttribute('aria-label', 'Search by voice');
    };
    button.classList.add('is-listening');
    button.setAttribute('aria-label', 'Listening…');
    try {
      recognition.start();
    } catch (err) {
      stop();
    }
  }

  button.addEventListener('click', function () {
    if (button.classList.contains('is-listening')) {
      stop();
    } else {
      start();
    }
  });
}
