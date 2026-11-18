/**
 * Maven Technosoft - Contact form handler
 * --------------------------------------------------------
 * Submits #maven-contact-form to the Azure Function at /api/contact,
 * which sends the email through your Office 365 tenant via Microsoft
 * Graph. The function lives alongside the static site in Azure Static
 * Web Apps - no third-party service involved.
 *
 * Same-origin POST to /api/contact - no extra config needed.
 */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('maven-contact-form');
    if (!form) return;

    var loading   = form.querySelector('.loading');
    var errorBox  = form.querySelector('.error-message');
    var sentBox   = form.querySelector('.sent-message');
    var submitBtn = form.querySelector('button[type="submit"]');

    function show(el) { if (el) el.style.display = 'block'; }
    function hide(el) { if (el) el.style.display = 'none'; }
    function reset() {
      hide(loading); hide(errorBox); hide(sentBox);
      if (errorBox) errorBox.textContent = '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopPropagation();
      reset();

      // Honeypot - if filled, silently pretend success
      var honey = form.querySelector('input[name="botcheck"]');
      if (honey && honey.checked) { show(sentBox); form.reset(); return; }

      show(loading);
      if (submitBtn) submitBtn.disabled = true;

      // Build JSON payload from form fields
      var data = new FormData(form);
      var payload = {};
      data.forEach(function (val, key) { payload[key] = val; });

      var endpoint = (form.getAttribute('action') || '/api/contact');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; })
                  .then(function (json) { return { ok: res.ok, status: res.status, json: json }; });
        })
        .then(function (r) {
          hide(loading);
          if (submitBtn) submitBtn.disabled = false;

          if (r.ok && r.json && r.json.success) {
            show(sentBox);
            form.reset();
          } else {
            var msg = (r.json && r.json.message)
              ? r.json.message
              : 'Sorry, the message could not be sent right now. Please email us directly at info@maventechno.com.';
            if (errorBox) { errorBox.textContent = msg; show(errorBox); }
          }
        })
        .catch(function () {
          hide(loading);
          if (submitBtn) submitBtn.disabled = false;
          if (errorBox) {
            errorBox.textContent =
              'Network error - please check your connection or email us directly at info@maventechno.com.';
            show(errorBox);
          }
        });
    });
  });
})();

/* ---------- Newsletter "Stay in the Loop" footer form ---------- */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('maven-newsletter-form');
    if (!form) return;
    var feedback = form.querySelector('.newsletter-feedback');
    var submitBtn = form.querySelector('input[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailInput = form.querySelector('input[type="email"]');
      var email = emailInput ? emailInput.value.trim() : '';
      if (!email) return;

      if (feedback) { feedback.textContent = 'Subscribing...'; feedback.style.color = '#635551'; }
      if (submitBtn) submitBtn.disabled = true;

      var payload = {
        name: 'Newsletter Subscriber',
        email: email,
        company: '',
        phone: '',
        user_subject: 'Newsletter Signup',
        message: 'Please subscribe ' + email + ' to the Maven Technosoft newsletter (signed up via the website footer).'
      };

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, json: j }; }); })
        .then(function (r) {
          if (submitBtn) submitBtn.disabled = false;
          if (r.ok && r.json && r.json.success) {
            if (feedback) { feedback.textContent = 'Thanks! You are on the list.'; feedback.style.color = '#1ec38a'; }
            form.reset();
          } else {
            var msg = (r.json && r.json.message) ? r.json.message
                    : 'Could not subscribe right now. Please email info@maventechno.com.';
            if (feedback) { feedback.textContent = msg; feedback.style.color = '#ff5821'; }
          }
        })
        .catch(function () {
          if (submitBtn) submitBtn.disabled = false;
          if (feedback) {
            feedback.textContent = 'Network error - please email info@maventechno.com.';
            feedback.style.color = '#ff5821';
          }
        });
    });
  });
})();
