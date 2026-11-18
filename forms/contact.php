<?php
/**
 * Maven Technosoft - Contact Form Handler
 * Receives the form POST and emails it to info@maventechno.com.
 * Works in two modes:
 *   1. Uses the "PHP Email Form" library if it's installed
 *      at assets/vendor/php-email-form/php-email-form.php (Pro template).
 *   2. Falls back to PHP's mail() so it works on any PHP host.
 *
 * Returns "OK" on success, or an error string on failure - the
 * format that the bundled assets/vendor/php-email-form/validate.js expects.
 */

// ---- CONFIG --------------------------------------------------------------
$receiving_email_address = 'info@maventechno.com';
$site_name               = 'Maven Technosoft';

// Optional SMTP. Leave host empty to use the host's default mail() transport.
$smtp = array(
    'host'     => '',     // e.g. 'smtp.hostinger.com'
    'username' => '',     // e.g. 'info@maventechno.com'
    'password' => '',     // SMTP password / app password
    'port'     => '587',
    'secure'   => 'tls',  // 'tls' or 'ssl'
);
// --------------------------------------------------------------------------

function maven_input($key, $default = '') {
    if (!isset($_POST[$key])) return $default;
    $val = is_array($_POST[$key]) ? implode(', ', $_POST[$key]) : $_POST[$key];
    // Strip CR/LF to prevent header injection
    $val = str_replace(array("\r", "\n", "%0a", "%0d"), ' ', $val);
    return trim($val);
}

$name    = maven_input('name');
$email   = maven_input('email');
$company = maven_input('company');
$phone   = maven_input('phone');
$subject = maven_input('subject', 'New enquiry from maventechno.com');
$message = isset($_POST['message']) ? trim((string)$_POST['message']) : '';

// Honeypot - silently accept if a hidden "website" field is filled (bots)
if (!empty($_POST['website'])) { echo 'OK'; exit; }

// Validate
$errors = array();
if ($name === '')                                                    $errors[] = 'Name is required.';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL))     $errors[] = 'A valid email is required.';
if ($subject === '')                                                 $errors[] = 'Subject is required.';
if ($message === '')                                                 $errors[] = 'Message is required.';

if (!empty($errors)) {
    http_response_code(400);
    echo implode(' ', $errors);
    exit;
}

// ---- Mode 1: PHP Email Form library (Pro Flexor template) ----------------
$lib = __DIR__ . '/../assets/vendor/php-email-form/php-email-form.php';
if (file_exists($lib)) {
    include($lib);

    $contact = new PHP_Email_Form;
    $contact->ajax = true;

    $contact->to         = $receiving_email_address;
    $contact->from_name  = $name;
    $contact->from_email = $email;
    $contact->subject    = '[' . $site_name . '] ' . $subject;

    if (!empty($smtp['host'])) {
        $contact->smtp = $smtp;
    }

    $contact->add_message($name,    'From');
    $contact->add_message($email,   'Email');
    if ($company !== '') $contact->add_message($company, 'Company');
    if ($phone   !== '') $contact->add_message($phone,   'Phone');
    $contact->add_message($message, 'Message', 10);

    echo $contact->send();
    exit;
}

// ---- Mode 2: Fallback using PHP mail() -----------------------------------
$body  = "New enquiry from the Maven Technosoft website\n";
$body .= str_repeat('-', 50) . "\n";
$body .= "Name    : " . $name . "\n";
$body .= "Email   : " . $email . "\n";
if ($company !== '') $body .= "Company : " . $company . "\n";
if ($phone   !== '') $body .= "Phone   : " . $phone . "\n";
$body .= "Subject : " . $subject . "\n";
$body .= str_repeat('-', 50) . "\n\n";
$body .= $message . "\n\n";
$body .= str_repeat('-', 50) . "\n";
$body .= "Sent from the contact form at maventechno.com\n";
$body .= 'IP: ' . (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown') . "\n";
$body .= 'Time: ' . date('Y-m-d H:i:s') . "\n";

$headers   = array();
$headers[] = 'From: ' . $site_name . ' Website <no-reply@maventechno.com>';
$headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
$headers[] = 'X-Mailer: PHP/' . phpversion();
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

$mailSubject = '[' . $site_name . '] ' . $subject;

$ok = @mail($receiving_email_address, $mailSubject, $body, implode("\r\n", $headers));

if ($ok) {
    echo 'OK';
} else {
    http_response_code(500);
    echo 'Sorry, the message could not be sent right now. Please email us directly at ' . $receiving_email_address . '.';
}
