(() => {
  'use strict';
  const form = document.querySelector('#logo-inquiry-form');
  const submit = form.querySelector('[type="submit"]');
  const status = document.querySelector('#logo-form-status');
  const label = submit.textContent;
  const params = new URLSearchParams(location.search);
  function setAttribution() {
    for (const name of ['utm_source', 'utm_medium', 'utm_campaign']) {
      form.elements.namedItem(name).value = (params.get(name) || '').slice(0, 200);
    }
    form.elements.namedItem('landing_page').value = location.origin + location.pathname;
  }
  setAttribution();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || !form.reportValidity()) return;
    status.hidden = true;
    submit.disabled = true;
    submit.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, signal: controller.signal });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error('Unconfirmed submission');
      form.reset();
      setAttribution();
      status.dataset.state = 'success';
      status.textContent = 'Your logo inquiry has been sent. Thanks for reaching out — I’ll review it and get back to you.';
      location.assign(new URL('sent/', location.href).href);
    } catch {
      status.dataset.state = 'error';
      status.textContent = 'Your request couldn’t be confirmed. Your details are still here. Please try again, or email matt@manicwebmaster.com.';
    } finally {
      clearTimeout(timeout);
      status.hidden = false;
      submit.disabled = false;
      submit.textContent = label;
      form.removeAttribute('aria-busy');
    }
  });
})();
