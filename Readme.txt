Maven Technosoft - Reskinned Website (Flexor + Maven custom)
============================================================

OVERVIEW
--------
A reskinned, content-customized version of the Flexor Bootstrap template,
re-themed for Maven Technosoft Pvt. Ltd. and enhanced with:
  - A dedicated AI Solutions section (6 capability cards)
  - An Industries section (Travel, Logistics, Hospitality, BFSI)
  - A working contact form that sends email via your own Office 365
    tenant using Microsoft Graph - no third-party service.
  - Custom Maven brand logo (inline SVG + wordmark, no image asset)

The site is designed to deploy directly to Azure Static Web Apps.
The contact form runs as a tiny Azure Function (Node.js) inside the same
SWA resource - included in the SWA Free tier.


====================================================================
1. DEPLOY TO AZURE STATIC WEB APPS
====================================================================
1. Push this folder (maven-reskining) to a Git repo (GitHub or Azure
   DevOps).
2. In the Azure Portal, create a new "Static Web App".
3. Connect your repo and branch.
4. Build presets - choose "Custom":
       App location:    /          (or /maven-reskining if it sits
                                     inside a parent repo)
       Api location:    api
       Output location: (leave blank)
5. Click Create. Azure builds and deploys, then gives you a URL like
   https://<random>.azurestaticapps.net.

The included staticwebapp.config.json sets fallback routing, security
headers and the /api/contact route.

To map a custom domain (e.g. www.maventechno.com) - in the Static Web
App resource, "Custom domains" -> follow the wizard.


====================================================================
2. ONE-TIME OFFICE 365 / MICROSOFT GRAPH SETUP
====================================================================
Goal: let the website's Azure Function send mail FROM info@maventechno.com
through your own Microsoft 365 tenant via Microsoft Graph.

STEP 1: Register an app in Microsoft Entra ID (Azure AD)
--------------------------------------------------------
1. Go to https://entra.microsoft.com (or Azure Portal -> Microsoft Entra ID).
2. App registrations -> New registration.
3. Name:                "Maven Website Contact Form"
4. Supported accounts:  "Accounts in this organizational directory only"
5. Redirect URI:        leave blank
6. Click Register.
7. On the Overview blade, copy and save:
       - Application (client) ID
       - Directory (tenant) ID

STEP 2: Create a client secret
------------------------------
1. In your new app -> "Certificates & secrets" -> "Client secrets".
2. New client secret -> Description "SWA contact form" -> 24 months.
3. Copy the "Value" (NOT the Secret ID) immediately. You will not
   be able to see it again later.

STEP 3: Grant Mail.Send permission
----------------------------------
1. In your app -> "API permissions" -> "Add a permission".
2. Choose "Microsoft Graph" -> "Application permissions".
3. Search for "Mail.Send" -> tick it -> "Add permissions".
4. IMPORTANT: click "Grant admin consent for <your tenant>".
   (You need to be a Global Admin or Privileged Role Admin for this.)
5. After consenting, the row should show a green check under Status.

STEP 4 (recommended): Restrict the app to ONE mailbox
-----------------------------------------------------
The "Mail.Send" application permission technically lets the app send
mail as ANY user in the tenant. To restrict it to ONLY info@maventechno.com,
run this in PowerShell once (Exchange Online Management module):

   Connect-ExchangeOnline
   New-ApplicationAccessPolicy `
       -AppId <APP-CLIENT-ID> `
       -PolicyScopeGroupId info@maventechno.com `
       -AccessRight RestrictAccess `
       -Description "Restrict Maven website contact form to info mailbox"

(You can install the module with:  Install-Module ExchangeOnlineManagement)


====================================================================
3. CONFIGURE THE STATIC WEB APP
====================================================================
1. In the Azure Portal, open your Static Web App.
2. "Settings" -> "Environment variables" (called "Configuration" /
   "Application settings" on older blades).
3. Add these settings (Production environment):

       AZURE_TENANT_ID      = <Directory (tenant) ID from STEP 1>
       AZURE_CLIENT_ID      = <Application (client) ID from STEP 1>
       AZURE_CLIENT_SECRET  = <Secret value from STEP 2>
       FROM_MAILBOX         = info@maventechno.com
       TO_EMAIL             = info@maventechno.com

4. Save. The Function will pick them up immediately - no redeploy needed.

That's it. Submit the form once at https://<your-site>/#contact and the
email should arrive at info@maventechno.com within seconds.


====================================================================
4. LOCAL TESTING (OPTIONAL)
====================================================================
If you want to test the API locally before deploying:
   1. Install: Node 18+, Azure Functions Core Tools v4
              (npm i -g azure-functions-core-tools@4 --unsafe-perm true).
   2. Copy api/local.settings.json.template -> api/local.settings.json
      and fill in real values (this file is git-ignored).
   3. From the api/ folder, run:  func start
   4. Use SWA CLI to serve the static site + API together:
      npm i -g @azure/static-web-apps-cli
      swa start ./ --api-location ./api


====================================================================
5. WHAT'S IN THIS FOLDER
====================================================================
  index.html                       - Homepage (Maven branded, AI section)
  blog.html, blog-single.html,
  inner-page.html,
  portfolio-details.html           - Original Flexor pages, untouched

  assets/css/style.css             - Original Flexor styles
  assets/css/maven-custom.css      - Maven brand overrides + AI section
  assets/js/main.js                - Original Flexor JS
  assets/js/maven-contact.js       - Contact form -> /api/contact handler

  api/host.json                    - Azure Functions host config
  api/package.json                 - API dependencies (none extra)
  api/.gitignore                   - Ignores local.settings.json
  api/local.settings.json.template - Template for local dev secrets
  api/contact/function.json        - HTTP trigger config for /api/contact
  api/contact/index.js             - The Function: Microsoft Graph email

  staticwebapp.config.json         - SWA routing, headers, API routes
  forms/contact.php                - Legacy PHP handler (NOT used; safe to delete)
  Readme.txt                       - This file


====================================================================
6. LOGO
====================================================================
The Maven Technosoft wordmark in the header is rendered inline in
index.html as styled HTML + an inline SVG mark. Responsive, retina-crisp,
no image asset needed.

To replace later with a PNG/SVG file:
  1. Drop the file into assets/img/ (e.g. maven-logo.svg).
  2. In index.html, replace the <span class="maven-logo"> ... </span>
     block inside <div class="logo"> ... </div> with:

       <a href="index.html"><img src="assets/img/maven-logo.svg"
            alt="Maven Technosoft" class="img-fluid" style="max-height:54px"></a>


====================================================================
CREDITS
====================================================================
Template Name: Flexor
Template URL:  https://bootstrapmade.com/flexor-free-multipurpose-bootstrap-template/
Author:        BootstrapMade.com
License:       https://bootstrapmade.com/license/
