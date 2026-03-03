# Prerequisites

Complete these steps before following either implementation guide. Both the UI Card and Workflow Action require the same foundational setup.

---

## 1. HubSpot Account

### HubSpot Tier Requirements

> **Important:** Both components of this integration rely on HubSpot features that are gated behind paid tiers in production:
>
> | Feature | Required tier |
> |---|---|
> | CRM UI Extensions (the card) | Any Hub **Enterprise** |
> | Custom coded workflow actions | **Operations Hub Professional** or Enterprise |
>
> **The free HubSpot CRM does not support either feature in production.** If you are evaluating or testing this integration, a free developer test account (see below) provides full access to both features at no cost.

### Choose Your Account

| Account type | When to use it |
|---|---|
| **Production account** (Enterprise / Ops Hub Pro+) | You're ready to go live and your account meets the tier requirements above |
| **Sandbox account** (Enterprise / Ops Hub Pro+) | Your plan includes a sandbox — safest option for testing before production |
| **Free developer test account** | You want to evaluate or demo the integration without a paid account |

A developer test account is recommended if you're setting this up for the first time or don't have an account that meets the tier requirements above. To create one:

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

## 6. Postman or curl (UI Card only)

The UI Card setup requires a batch API call to create custom HubSpot properties. The guide uses [Postman](https://www.postman.com/) — the web version works fine, but the desktop app is recommended. If you're comfortable on the command line, `curl` works equally well for the same call.

> This is **not required** for the Workflow Action guide.

---

Once you have everything above in place, proceed to the relevant guide:

- [UI Card Guide](guide-ui-card.md)
- [Workflow Action Guide](guide-workflow-action.md)
