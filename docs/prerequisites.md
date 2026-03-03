# Prerequisites

Complete these steps before following either implementation guide. Both the UI Card and Workflow Action require the same foundational setup.

---

## 1. HubSpot Account

You can deploy this integration to any HubSpot account where you have admin access:

| Account type | When to use it |
|---|---|
| **Production account** | You're ready to go live and have admin access |
| **Sandbox account** | Your plan includes a sandbox — safest option for testing before production |
| **Free developer test account** | You want a disposable environment to experiment with first |

A developer test account is recommended if you're setting this up for the first time or don't want to touch a live account. To create one:

1. Sign up at [https://developers.hubspot.com/get-started](https://developers.hubspot.com/get-started)
2. Select **"Create app developer account"** and follow the prompts until you reach the **Developer Home** screen
3. From there, navigate to **Test Accounts → Create developer test account**

> If you're deploying directly to a production or sandbox account, you can skip creating a developer test account — just ensure you have a Personal Access Key for that account (covered in the UI Card guide).

---

## 2. Node.js

Install **Node.js 18 or higher**: [https://nodejs.org](https://nodejs.org)

Verify your installation:
```bash
node -v
```

---

## 3. HubSpot CLI

Install the HubSpot CLI via npm:
```bash
npm install -g @hubspot/cli
```

Verify your installation:
```bash
hs --version
```

Full setup reference: [HubSpot Local Development Docs](https://developers.hubspot.com/docs/guides/cms/setup/getting-started-with-local-development#install-dependencies)

---

## 4. Kickbox Account & API Key

You need a [Kickbox account](https://kickbox.com/) with an API key.

- Your API key can be found in your Kickbox account under **API Keys**
- Either a test key or a production key will work

---

## 5. Code Editor

[Visual Studio Code](https://code.visualstudio.com/) is recommended if you are unsure which editor to use. The examples in these guides reference VS Code, but any editor will work.

---

## 6. Postman (UI Card only)

The UI Card setup requires a batch API call to create custom HubSpot properties. [Postman](https://www.postman.com/) is used for this in the guide — the web version works fine, but the desktop app is recommended.

> This is **not required** for the Workflow Action guide.

---

Once you have everything above in place, proceed to the relevant guide:

- [UI Card Guide](guide-ui-card.md)
- [Workflow Action Guide](guide-workflow-action.md)
