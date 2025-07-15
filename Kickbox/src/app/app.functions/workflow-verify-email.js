// src/app/app.functions/workflow-verify-email.js

const hubspot = require('@hubspot/api-client');

exports.main = async (event, context) => {
  // --- Retrieve Secrets ---
  // Ensure 'kickbox' and 'private_app' secrets are configured in your HubSpot app settings.
  const KICKBOX_API_KEY = process.env.kickbox;
  const HUBSPOT_ACCESS_TOKEN = process.env.private_app;

  if (!KICKBOX_API_KEY) {
    console.error("Workflow Action Error: Kickbox API key not configured.");
    // In workflow actions, throwing an error is how you signal failure to HubSpot.
    throw new Error("Kickbox API key not configured in secrets.");
  }
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.error("Workflow Action Error: HubSpot Access Token not configured.");
    throw new Error("HubSpot Access Token not configured in secrets.");
  }

  // --- Extract Data from Workflow Event ---
  // The objectId of the enrolled contact is available in event.object.objectId
  const contactId = event.object.objectId;

  if (!contactId) {
    console.error("Workflow Action Error: Missing 'objectId' in workflow event.");
    throw new Error("Contact ID is missing from the workflow event. Cannot proceed.");
  }

  console.log(`Workflow action triggered for Contact ID: ${contactId}`);

  let contactEmail;
  try {
    // Initialize HubSpot API client
    const hubspotClient = new hubspot.Client({
      accessToken: HUBSPOT_ACCESS_TOKEN,
    });

    // Fetch the contact's email property
    const contactResponse = await hubspotClient.crm.contacts.basicApi.getById(
      contactId,
      ['email'] // Request only the email property
    );
    contactEmail = contactResponse.properties.email;

    if (!contactEmail) {
      console.warn(`Workflow Action: Contact ${contactId} has no email. Skipping Kickbox verification.`);
      // Return success with no verification data if no email is found,
      // or throw an error if you consider this a critical failure.
      return {
        outputFields: {
          kickbox_result: "no_email",
          kickbox_reason: "Contact has no email property",
          kickbox_success: false
        },
        message: `Contact ${contactId} has no email. No verification performed.`
      };
    }

    console.log(`Fetched email for contact ${contactId}: ${contactEmail}`);

  } catch (error) {
    console.error(`Error fetching contact ${contactId} email from HubSpot:`, error);
    throw new Error(`Failed to fetch contact email from HubSpot: ${error.message}`);
  }

  let kickboxResults = {};
  try {
    // Call the Kickbox API
    const kickboxResponse = await fetch(`https://api.kickbox.com/v2/verify?email=${encodeURIComponent(contactEmail)}&apikey=${KICKBOX_API_KEY}`);

    if (!kickboxResponse.ok) {
      const errorText = await kickboxResponse.text();
      console.error(`Kickbox API responded with status: ${kickboxResponse.status}, body: ${errorText}`);
      throw new Error(`Kickbox API responded with status: ${kickboxResponse.status} - ${errorText}`);
    }

    kickboxResults = await kickboxResponse.json();
    console.log(`Kickbox raw result for ${contactEmail}:`, kickboxResults);

    if (kickboxResults.error) {
        console.error(`Kickbox returned an error: ${kickboxResults.error}`);
        throw new Error(`Kickbox API error: ${kickboxResults.error}`);
    }

  } catch (error) {
    console.error('Error during Kickbox API call:', error);
    throw new Error(`Failed to verify email with Kickbox: ${error.message}`);
  }

  // --- Map Kickbox results to HubSpot property values ---
  // Ensure boolean values are stored as 'true'/'false' strings for HubSpot properties
  const mapBooleanToHubSpotString = (boolValue) => (boolValue === true ? 'true' : 'false');

  const propertiesToUpdate = {
    "kickbox_result": kickboxResults.result,
    "kickbox_reason": kickboxResults.reason,
    "kickbox_disposable": mapBooleanToHubSpotString(kickboxResults.disposable),
    "kickbox_accept_all": mapBooleanToHubSpotString(kickboxResults.accept_all),
    "kickbox_role": mapBooleanToHubSpotString(kickboxResults.role),
    "kickbox_free": mapBooleanToHubSpotString(kickboxResults.free),
    "kickbox_sendex": kickboxResults.sendex,
    "kickbox_did_you_mean": kickboxResults.did_you_mean,
    "kickbox_success": mapBooleanToHubSpotString(kickboxResults.success),
    "kickbox_email_normalized": kickboxResults.email,
    "kickbox_verification_date": new Date().toISOString(), // Set current date/time
  };

  // Filter out null/undefined values before sending to HubSpot
  Object.keys(propertiesToUpdate).forEach(key => {
    if (propertiesToUpdate[key] === undefined || propertiesToUpdate[key] === null) {
      delete propertiesToUpdate[key];
    }
  });

  // --- Update HubSpot Contact Properties ---
  try {
    const hubspotClient = new hubspot.Client({
      accessToken: HUBSPOT_ACCESS_TOKEN,
    });

    const apiResponse = await hubspotClient.crm.contacts.basicApi.update(
      contactId,
      { properties: propertiesToUpdate }
    );

    console.log(`Successfully updated HubSpot contact ${contactId} with Kickbox results.`);

  } catch (e) {
    console.error('Error updating HubSpot contact properties:', e);
    // Provide more detailed error message if possible
    if (e.message === 'HTTP request failed' && e.response) {
      console.error(JSON.stringify(e.response, null, 2));
      throw new Error(`Failed to update HubSpot contact properties: ${e.response.body?.message || e.message}`);
    } else {
      throw new Error(`Failed to update HubSpot contact properties: ${e.message}`);
    }
  }

  // --- Return Output Fields for Workflow ---
  // These output fields can be used in subsequent workflow actions.
  return {
    outputFields: {
      kickbox_result: kickboxResults.result,
      kickbox_reason: kickboxResults.reason,
      kickbox_disposable: kickboxResults.disposable,
      kickbox_accept_all: kickboxResults.accept_all,
      kickbox_role: kickboxResults.role,
      kickbox_free: kickboxResults.free,
      kickbox_sendex: kickboxResults.sendex,
      kickbox_did_you_mean: kickboxResults.did_you_mean,
      kickbox_success: kickboxResults.success,
      kickbox_email_normalized: kickboxResults.email,
      kickbox_verification_date: new Date().toISOString(),
      verifiedContactId: contactId, // Also output the contact ID for convenience
      verifiedEmail: contactEmail // Also output the email for convenience
    },
    message: `Email verified for contact ${contactId} (${contactEmail}). Result: ${kickboxResults.result}`
  };
};
