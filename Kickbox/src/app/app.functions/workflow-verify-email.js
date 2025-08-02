// src/app/app.functions/workflow-verify-email.js

const hubspot = require('@hubspot/api-client');
const axios = require('axios'); // Assuming axios is installed in app.functions/

exports.main = async (event, callback) => {
  // --- Retrieve Secrets ---
  // Ensure 'kickbox' and 'private_app' secrets are configured in your HubSpot app secrets.
  const KICKBOX_API_KEY = process.env.kickbox;
  const HUBSPOT_ACCESS_TOKEN = process.env.private_app;

  // Use the callback to signal success or failure to the workflow
  const handleError = (message) => {
    console.error(message);
    callback({
      success: false,
      message: message
    });
  };

  if (!KICKBOX_API_KEY) {
    return handleError("Workflow Action Error: Kickbox API key not configured.");
  }
  if (!HUBSPOT_ACCESS_TOKEN) {
    return handleError("Workflow Action Error: HubSpot Access Token not configured.");
  }

  // --- Extract Data from Workflow Event ---
  // The input fields we define in app.json will be available in event.inputFields
  const contactId = event.inputFields.contact_id;
  const contactEmail = event.inputFields.contact_email;

  if (!contactId || !contactEmail) {
    return handleError("Workflow Action Error: Missing 'contact_id' or 'contact_email' in workflow event.");
  }

  console.log(`Workflow action triggered for Contact ID: ${contactId}, Email: ${contactEmail}`);

  let kickboxResults = {};
  try {
    // Call the Kickbox API
    const kickboxResponse = await axios.get(`https://api.kickbox.com/v2/verify?email=${encodeURIComponent(contactEmail)}&apikey=${KICKBOX_API_KEY}`);

    kickboxResults = kickboxResponse.data;
    console.log(`Kickbox raw result for ${contactEmail}:`, kickboxResults);

    if (kickboxResults.error) {
        return handleError(`Kickbox API error: ${kickboxResults.error}`);
    }

  } catch (error) {
    console.error('Error during Kickbox API call:', error);
    return handleError(`Failed to verify email with Kickbox: ${error.message}`);
  }

  // --- Map Kickbox results to HubSpot property values ---
  const mapBooleanToHubSpotString = (boolValue) => (boolValue === true ? 'true' : 'false');

  const propertiesToUpdate = {
    "kickbox_result": kickboxResults.result || 'unknown',
    "kickbox_reason": kickboxResults.reason || '',
    "kickbox_disposable": mapBooleanToHubSpotString(kickboxResults.disposable),
    "kickbox_accept_all": mapBooleanToHubSpotString(kickboxResults.accept_all),
    "kickbox_role": mapBooleanToHubSpotString(kickboxResults.role),
    "kickbox_free": mapBooleanToHubSpotString(kickboxResults.free),
    "kickbox_sendex": kickboxResults.sendex,
    "kickbox_did_you_mean": kickboxResults.did_you_mean,
    "kickbox_success": mapBooleanToHubSpotString(kickboxResults.success),
    "kickbox_email_normalized": kickboxResults.email,
    "kickbox_verification_date": new Date().toISOString(),
  };

  // --- Update HubSpot Contact Properties ---
  try {
    const hubspotClient = new hubspot.Client({
      accessToken: HUBSPOT_ACCESS_TOKEN,
    });

    await hubspotClient.crm.contacts.basicApi.update(
      contactId,
      { properties: propertiesToUpdate }
    );

    console.log(`Successfully updated HubSpot contact ${contactId} with Kickbox results.`);

  } catch (e) {
    console.error('Error updating HubSpot contact properties:', e);
    // Throwing an error here will cause the workflow action to fail
    return handleError(`Failed to update HubSpot contact properties: ${e.message}`);
  }

  // --- Return Output Fields for Workflow ---
  // The output fields will be available in subsequent workflow actions.
  callback({
    success: true,
    message: `Email verified for contact ${contactId} (${contactEmail}). Result: ${kickboxResults.result}`,
    outputFields: {
      kickbox_result: kickboxResults.result,
      kickbox_reason: kickboxResults.reason,
      kickbox_success: kickboxResults.success
    }
  });
};