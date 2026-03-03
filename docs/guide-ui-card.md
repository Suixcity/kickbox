# UI Card Implementation Guide

This guide walks through deploying the Kickbox CRM UI cards to a HubSpot contact record. Once installed, a **"Verify Email with Kickbox"** button will appear on contact records, allowing anyone to verify an email address in real time without leaving HubSpot.

**Video walkthrough:** [Kickbox Tab Card Instructions — Loom (7 August 2025)](https://www.loom.com/share/377a168efc5b43c89868f1969c0f428e?sid=a01dbbd2-1a9e-49f4-89d1-e394b3c14f50)

> **Before you start:** Complete the [Prerequisites](prerequisites.md) guide first.

---

## Step 1 — Choose Your Target HubSpot Account

This project can be deployed to any HubSpot account where you have admin access — your production account, a sandbox, or a free developer test account. Choose whichever suits your situation:

- **Production or sandbox account** — skip to Step 2 and generate a Personal Access Key from that account
- **Developer test account** — follow the steps below to create a fresh one

To create a developer test account:
1. Open your HubSpot developer account at [developers.hubspot.com](https://developers.hubspot.com)
2. In the left sidebar, navigate to **Test Accounts** and click **Create developer test account**
3. Name it whatever you like and click **Create**
4. Click on the newly created account to open it

---

## Step 2 — Enable CRM Development & Get Your Access Key

> If you are deploying to a production or sandbox account, CRM Development may already be enabled. Navigate to **Settings → Account → Integrations → Personal Access Keys** and generate a key there, then skip to Step 3.

For a developer test account:
1. Inside the account, click **CRM Development** in the left sidebar (the bottom-most option)
2. Click **Join Beta** in the page header, select your developer test account when prompted, agree to the terms, and click **Join Beta**
3. Return to the **CRM Development** tab — under **Tools**, click **Personal Access Key**
4. Click **Generate personal access key** and leave it open — you will need it in the next step

---

## Step 3 — Authenticate the HubSpot CLI

Open a terminal in VS Code (`Ctrl + ~` or **View → Terminal**) and run:

```bash
hs account auth
```

- Use the arrow keys to select **Enter existing personal access key**
- Paste the personal access key you generated above and press Enter
- Name the account or press Enter to accept the default
- Enter `Y` to confirm and use this account

---

## Step 4 — Add Secrets

Add your Kickbox API key and a placeholder for the HubSpot private app token. Both secrets must be named exactly as shown:

```bash
hs secret add kickbox
```
Enter your Kickbox API key when prompted (found in your Kickbox account under **API Keys**).

```bash
hs secret add private_app
```
Enter any placeholder value for now (e.g. `holder`). This will be updated in Step 6.

---

## Step 5 — Clone & Upload the Project

Clone this repository:
```bash
git clone https://github.com/Suixcity/kickbox
```

Navigate into the project folder:
```bash
cd kickbox/Kickbox
```

Upload the project to your HubSpot account:
```bash
hs project upload
```

You should see the project upload and deploy successfully.

---

## Step 6 — Update the Private App Secret

After uploading, HubSpot automatically creates a private app called **Kickbox-Verification** in your HubSpot account.

1. In your HubSpot account, go to **Settings → Integrations → Private Apps**
2. Click on **Kickbox-Verification** and then click **View access token**
3. Copy the token value
4. Back in your terminal, update the secret with the real value:

```bash
hs secret update private_app
```
Paste the access token when prompted.

---

## Step 7 — Create the HubSpot Contact Properties

The cards write verification data to custom contact properties. These need to be created before the cards will function correctly.

**First, create a property group in HubSpot:**
1. Go to **Settings → Properties → Groups → Create group**
2. Name it exactly: `kickbox` (lowercase)

> This step is required. The API call in the next step will fail if this group does not exist.

**Then, create the properties via Postman:**

1. Open Postman and create a new blank collection, then click **Add a Request**
2. Change the request type from `GET` to `POST`
3. Set the URL to:
   ```
   https://api.hubapi.com/crm/v3/properties/contacts/batch/create
   ```
4. In the **Authorization** tab, select **Bearer Token** as the type and paste your `private_app` access token (the Kickbox-Verification token from Step 6)
5. In the **Body** tab, select **raw** and set the type to **JSON**
6. Paste the following JSON:

```json
{
  "inputs": [
    {
      "name": "kickbox_accept_all",
      "label": "Kickbox Accept All",
      "type": "enumeration",
      "fieldType": "booleancheckbox",
      "description": "true if the email was accepted, but the domain appears to accept all emails addressed to that domain.",
      "groupName": "kickbox",
      "options": [
        { "label": "Yes", "value": "true" },
        { "label": "No", "value": "false" }
      ]
    },
    {
      "name": "kickbox_did_you_mean",
      "label": "Kickbox did you mean",
      "type": "string",
      "fieldType": "text",
      "description": "Returns a suggested email if a possible spelling error was detected. (bill.lumbergh@gamil.com -> bill.lumbergh@gmail.com)",
      "groupName": "kickbox"
    },
    {
      "name": "kickbox_disposable",
      "label": "Kickbox Disposable",
      "type": "enumeration",
      "fieldType": "booleancheckbox",
      "description": "true if the email address uses a disposable domain like trashmail.com or mailinator.com.",
      "groupName": "kickbox",
      "options": [
        { "label": "Yes", "value": "true" },
        { "label": "No", "value": "false" }
      ]
    },
    {
      "name": "kickbox_email_normalized",
      "label": "Kickbox Email Normalized",
      "type": "string",
      "fieldType": "text",
      "description": "Returns a normalized version of the provided email address. (BoB@example.com -> bob@example.com)",
      "groupName": "kickbox"
    },
    {
      "name": "kickbox_free",
      "label": "Kickbox Free",
      "type": "enumeration",
      "fieldType": "booleancheckbox",
      "description": "true if the email address uses a free email service like gmail.com or yahoo.com.",
      "groupName": "kickbox",
      "options": [
        { "label": "Yes", "value": "true" },
        { "label": "No", "value": "false" }
      ]
    },
    {
      "name": "kickbox_reason",
      "label": "Kickbox Reason",
      "type": "enumeration",
      "fieldType": "select",
      "description": "",
      "groupName": "kickbox",
      "options": [
        { "label": "invalid_email", "value": "invalid_email" },
        { "label": "invalid_domain", "value": "invalid_domain" },
        { "label": "rejected_email", "value": "rejected_email" },
        { "label": "accepted_email", "value": "accepted_email" },
        { "label": "low_quality", "value": "low_quality" },
        { "label": "low_deliverability", "value": "low_deliverability" },
        { "label": "no_connect", "value": "no_connect" },
        { "label": "timeout", "value": "timeout" },
        { "label": "invalid_smtp", "value": "invalid_smtp" },
        { "label": "unavailable_smtp", "value": "unavailable_smtp" },
        { "label": "unexpected_error", "value": "unexpected_error" },
        { "label": "timeout_smtp", "value": "timeout_smtp" }
      ]
    },
    {
      "name": "kickbox_result",
      "label": "Kickbox Result",
      "type": "enumeration",
      "fieldType": "select",
      "description": "",
      "groupName": "kickbox",
      "options": [
        { "label": "Deliverable", "value": "deliverable" },
        { "label": "Risky", "value": "risky" },
        { "label": "Undeliverable", "value": "undeliverable" },
        { "label": "Unknown", "value": "unknown" }
      ]
    },
    {
      "name": "kickbox_role",
      "label": "Kickbox Role",
      "type": "enumeration",
      "fieldType": "booleancheckbox",
      "description": "true if the email address is a role address (postmaster@example.com, support@example.com, etc)",
      "groupName": "kickbox",
      "options": [
        { "label": "Yes", "value": "true" },
        { "label": "No", "value": "false" }
      ]
    },
    {
      "name": "kickbox_sendex",
      "label": "Kickbox Sendex",
      "type": "number",
      "fieldType": "number",
      "description": "A quality score of the provided email address ranging between 0 (no quality) and 1 (perfect quality).",
      "groupName": "kickbox"
    },
    {
      "name": "kickbox_success",
      "label": "Kickbox Success",
      "type": "enumeration",
      "fieldType": "booleancheckbox",
      "description": "true if the API request was successful (i.e., no authentication or unexpected errors occurred)",
      "groupName": "kickbox",
      "options": [
        { "label": "Yes", "value": "true" },
        { "label": "No", "value": "false" }
      ]
    },
    {
      "name": "kickbox_verification_date",
      "label": "Kickbox Verification Date",
      "type": "datetime",
      "fieldType": "date",
      "description": "The date the last kickbox verification occurred.",
      "groupName": "kickbox"
    }
  ]
}
```

7. Click **Send** — you should receive a `201 Created` response with status `COMPLETE`

---

## Step 8 — Add the Cards to Contact Records

1. In your HubSpot account, go to **Settings → Objects → Contacts → Record Customization → Default view**
2. Click the **+** icon in the center panel or right sidebar
3. Select the **Card library** tab
4. Add one or both cards:
   - **Kickbox Card - Tab** — appears as a tab on the contact record
   - **Email Verification Card - Side** — appears in the right sidebar
5. Click **Save and exit**

---

## Step 9 — Test

1. Navigate to **CRM → Contacts** in your HubSpot account
2. Open any contact that has an email address
3. Click **Verify Email with Kickbox**
4. You should see a success banner and the verification results displayed on the card

The contact record's Kickbox properties will now be populated and visible under the contact's property panel.

---

Next: [Workflow Action Guide](guide-workflow-action.md)
