const hubspot = require('@hubspot/api-client');

exports.main = async (context = {}) => {
  const { objectId } = context.parameters;
  
  if (!objectId) {
    return {
      statusCode: 400,
      body: { error: 'Object ID is required' }
    };
  }

  try {
    const hubspotClient = new hubspot.Client({
      accessToken: process.env.private_app
    });

    const contactResponse = await hubspotClient.crm.contacts.basicApi.getById(
      objectId,
      ['email', 'firstname', 'lastname']
    );

    return {
      statusCode: 200,
      body: {
        email: contactResponse.properties.email,
        firstname: contactResponse.properties.firstname,
        lastname: contactResponse.properties.lastname
      }
    };
  } catch (error) {
    console.error('Failed to fetch contact data:', error);
    return {
      statusCode: 500,
      body: { error: 'Failed to fetch contact data', details: error.message }
    };
  }
};