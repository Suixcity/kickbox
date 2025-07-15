// functions/verify-email.js (or src/app/app.functions/verify-email.js)

const hubspot = require('@hubspot/api-client');

exports.main = async (context = {}) => {
  // --- Retrieve Secrets ---
  const KICKBOX_API_KEY = process.env.kickbox;
  const HUBSPOT_ACCESS_TOKEN = process.env.private_app;

  if (!KICKBOX_API_KEY) {
    console.error("Serverless Function Error: Kickbox API key not configured.");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Kickbox API key not configured." })
    };
  }
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.error("Serverless Function Error: HubSpot Access Token not configured.");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "HubSpot Access Token not configured." })
    };
  }

  // --- Extract Data from Frontend Event ---
  const email = context.parameters.email;
  const contactId = context.parameters.contactId;

  if (!email || !contactId) {
    console.error("Serverless Function Error: Missing 'email' or 'contactId' in request parameters.");
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing 'email' or 'contactId' in request." })
    };
  }

  console.log(`Serverless function received request for Contact ID: ${contactId}, Email: ${email}`);

  let kickboxResults = {};
  try {
    const kickboxResponse = await fetch(`https://api.kickbox.com/v2/verify?email=${encodeURIComponent(email)}&apikey=${KICKBOX_API_KEY}`);

    if (!kickboxResponse.ok) {
      const errorText = await kickboxResponse.text();
      console.error(`Kickbox API responded with status: ${kickboxResponse.status}, body: ${errorText}`);
      throw new Error(`Kickbox API responded with status: ${kickboxResponse.status} - ${errorText}`);
    }

    kickboxResults = await kickboxResponse.json();
    console.log(`Kickbox raw result for ${email}:`, kickboxResults); // Log raw result for full inspection

    if (kickboxResults.error) {
        console.error(`Kickbox returned an error: ${kickboxResults.error}`);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Kickbox API error: ${kickboxResults.error}` })
        };
    }

  } catch (error) {
    console.error('Error during Kickbox API call:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Failed to verify email with Kickbox: ${error.message}` })
    };
  }

  // --- Map Kickbox results to HubSpot property values (based on your property definitions) ---
  const mapBooleanToYesNo = (boolValue) => (boolValue === true ? 'true' : 'false');


  const propertiesToUpdate = {
    "kickbox_result": kickboxResults.result, // Use the mapped status
    "kickbox_reason": kickboxResults.reason, // Direct string match 
    "kickbox_disposable": mapBooleanToYesNo(kickboxResults.disposable), // Mapped boolean
    "kickbox_accept_all": mapBooleanToYesNo(kickboxResults.accept_all), // Mapped boolean
    "kickbox_role": mapBooleanToYesNo(kickboxResults.role), // Mapped boolean
    "kickbox_free": mapBooleanToYesNo(kickboxResults.free), // Mapped boolean
    "kickbox_sendex": kickboxResults.sendex, // Number, direct match
    "kickbox_did_you_mean": kickboxResults.did_you_mean, // String, direct match
    "kickbox_success": mapBooleanToYesNo(kickboxResults.success), // Kickbox provides a 'success' boolean
    "kickbox_email_normalized": kickboxResults.email, // Kickbox returns normalized email in 'email' field
    "kickbox_verification_date": new Date().toISOString(), // Set current date/time for verification
  };

  // Filter out null/undefined values before sending to HubSpot
  Object.keys(propertiesToUpdate).forEach(key => {
    if (propertiesToUpdate[key] === undefined || propertiesToUpdate[key] === null) {
      delete propertiesToUpdate[key];
    }
  });

  // --- 3. Update HubSpot Contact Properties using @hubspot/api-client ---
  try {
    const hubspotClient = new hubspot.Client({
      accessToken: HUBSPOT_ACCESS_TOKEN,
    });

    const apiResponse = await hubspotClient.crm.contacts.basicApi.update(
      contactId,
      { properties: propertiesToUpdate }
    );

    console.log(`Successfully updated HubSpot contact ${contactId} using @hubspot/api-client`);

  } catch (e) {
    console.error('Error updating HubSpot contact using @hubspot/api-client:', e);
    if (e.message === 'HTTP request failed' && e.response) {
      console.error(JSON.stringify(e.response, null, 2));
      return {
        statusCode: e.response.statusCode || 500,
        body: JSON.stringify({ message: `Failed to update HubSpot contact: ${e.response.body?.message || e.message}` })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: `Failed to update HubSpot contact: ${e.message}` })
      };
    }
  }

  // --- Return Success Response to Frontend ---
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Email verified and contact updated successfully!",
      kickbox_result: kickboxResults.result, // Send original Kickbox result to frontend for display
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
    })
  };
};