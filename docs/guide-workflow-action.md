# Workflow Action Implementation Guide

This guide walks through setting up a custom coded workflow action that calls the Kickbox API from within HubSpot's automation engine. Once configured, the action can be added to any contact-based workflow to automatically verify email addresses at any point in your automation logic.

> **Before you start:** Complete the [Prerequisites](prerequisites.md) guide first.
>
> **Note on secrets:** This guide uses a secret named `kickboxapi` — this is distinct from the `kickbox` secret used in the UI Card guide. If you are setting up both components, you will have both secrets in HubSpot.

---

## Overview

HubSpot's **Custom Coded Actions** allow you to run Node.js code as a step inside any workflow. This action:

1. Takes the contact's email address as an input
2. Calls the Kickbox API to verify it
3. Returns the verification results as output fields
4. Those outputs can then be used in subsequent workflow steps (e.g. set contact properties, branch logic, send notifications)

---

## Step 1 — Add the Kickbox API Secret to HubSpot

The workflow action reads your Kickbox API key from a HubSpot secret named `kickboxapi`. There are two ways to add it — choose whichever is easier:

**Option A — Add it inside the workflow editor (simplest)**
Skip this step for now and add the secret directly in Step 3 when you configure the action. The editor has a built-in secrets manager.

**Option B — Add it via the HubSpot CLI**
If you have the CLI set up and authenticated:
```bash
hs secret add kickboxapi
```
Enter your Kickbox API key when prompted.

> Secrets in HubSpot workflows are separate from project secrets (used by the UI card). `kickboxapi` only needs to exist within the workflow action itself.

---

## Step 2 — Create or Open a Workflow

1. In HubSpot, navigate to **Automation → Workflows**
2. Create a new **Contact-based** workflow, or open an existing one
3. Add a new action step at the point where you want email verification to occur

---

## Step 3 — Add a Custom Coded Action

1. In the action selector, search for or scroll to **Custom coded action** and select it
2. Set the **Runtime** to `Node.js 20.x`
3. Under **Secrets**, add `kickboxapi` and paste your Kickbox API key as the value (if not already added via CLI)
4. Under **Input fields**, add one field:
   - **Label:** `email`
   - **Type:** Email
   - **Map to:** Contact property — Email (`email`)
5. Paste the following code into the code editor:

```javascript
const request = require('request');

exports.main = async (event, callback) => {
  var role, free, disposable, sendex, result, reason, accept, didyoumean, success, nemail;

  const email = event.inputFields['email'];
  const encodedEmail = encodeURIComponent(email);

  var options = {
    method: "GET",
    url: "https://api.kickbox.com/v2/verify?email=" + encodedEmail + "&apikey=" + process.env.kickboxapi
  };

  request(options, function (error, response, body) {
    if (error) {
      console.error('Error calling Kickbox API:', error);
      callback({ error: error });
      return;
    }

    try {
      const parsedBody = JSON.parse(body);

      role       = parsedBody.role;
      free       = parsedBody.free;
      disposable = parsedBody.disposable;
      sendex     = parsedBody.sendex;
      result     = parsedBody.result;
      reason     = parsedBody.reason;
      accept     = parsedBody.accept_all;
      didyoumean = parsedBody.did_you_mean;
      success    = parsedBody.success;
      nemail     = parsedBody.email;

      callback({
        outputFields: {
          accept,
          role,
          free,
          disposable,
          sendex,
          result,
          reason,
          didyoumean,
          success,
          nemail,
        }
      });
    } catch (parseError) {
      console.error('Error parsing Kickbox response:', parseError);
      callback({ error: 'Invalid JSON response from Kickbox' });
    }
  });
};
```

---

## Step 4 — Configure Output Fields

Under **Output fields**, add the following. These become available as data tokens in subsequent workflow steps.

| Label | Type |
|---|---|
| `accept` | Boolean |
| `role` | Boolean |
| `free` | Boolean |
| `disposable` | Boolean |
| `success` | Boolean |
| `sendex` | Number |
| `result` | Enumeration |
| `reason` | Enumeration |
| `didyoumean` | String |
| `nemail` | String |

**Enumeration values for `result`:**
- `deliverable`
- `risky`
- `undeliverable`
- `unknown`

**Enumeration values for `reason`:**
- `accepted_email`
- `invalid_email`
- `invalid_domain`
- `invalid_smtp`
- `low_deliverability`
- `low_quality`
- `no_connect`
- `rejected_email`
- `timeout_smtp`
- `unavailable_smtp`
- `unexpected_error`

---

## Step 5 — Use the Output in Your Workflow

After the coded action runs, the output fields are available as data tokens in any subsequent step. Common uses:

- **Set contact properties** — map `result`, `reason`, `sendex` etc. to custom HubSpot contact properties (see the property list in the [README](../README.md))
- **Branch logic** — use an `If/then` branch to route contacts differently based on `result` (e.g. only continue if `deliverable`)
- **Notifications** — include verification results in internal notification emails or Slack messages

---

## Example Use Case

A typical automation pattern:

```
Contact is created or updated
        ↓
Custom Coded Action: Kickbox Verify Email
        ↓
If/Then Branch: result = "deliverable"
    ├── Yes → Enrol in sales sequence / assign to rep
    └── No  → Add to suppression list / flag for review
```

---

Previous: [UI Card Guide](guide-ui-card.md)
