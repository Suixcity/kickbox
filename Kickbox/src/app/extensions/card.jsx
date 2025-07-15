import React, { useState, useEffect } from 'react';
import {
  Divider,
  Link,
  Button,
  Text,
  Input,
  Flex,
  Heading,
  Alert,
  Box,
  StatusTag,
  hubspot,
} from '@hubspot/ui-extensions';

hubspot.extend(({ context, runServerlessFunction, actions, crm }) => (
  <EmailVerificationCard
    context={context}
    runServerlessFunction={runServerlessFunction}
    actions={actions}
    crm={crm}
  />
));

const EmailVerificationCard = ({ context, runServerlessFunction, actions, crm }) => {
  const [contactEmail, setContactEmail] = useState('Loading contact email...');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [objectId, setObjectId] = useState(null);

  useEffect(() => {
    console.log("HubSpot Context (from useEffect):", context);

    if (!actions || !actions.fetchCrmObjectProperties) {
      console.error("fetchCrmObjectProperties not available in actions. Cannot fetch CRM properties.");
      setError("App initialization error: Cannot fetch CRM properties.");
      return;
    }

    actions.fetchCrmObjectProperties([
      'email',
      'hs_object_id',
      'kickbox_result',
      'kickbox_reason',
      'kickbox_disposable',
      'kickbox_accept_all',
      'kickbox_role',
      'kickbox_free',
      'kickbox_sendex',
      'kickbox_did_you_mean',
      'kickbox_success',
      'kickbox_email_normalized',
      'kickbox_verification_date',
      'kickbox_verified_email'
    ])
      .then(properties => {
        console.log("Fetched CRM Properties (from useEffect):", properties);

        let currentContactEmail = null;
        let currentObjectId = null;
        let currentError = null;

        if (properties.email) {
          currentContactEmail = properties.email;
          console.log("Contact Email set from fetched properties:", currentContactEmail);
        } else {
          currentContactEmail = 'No email found.';
          currentError = 'No email found for this contact. Cannot verify.';
        }

        if (properties.hs_object_id) {
          currentObjectId = properties.hs_object_id;
          console.log("ObjectId set from fetched properties:", currentObjectId);
        } else {
          currentObjectId = 'N/A';
          currentError = currentError ? currentError + ' Also, could not load contact ID.' : 'Could not load contact ID. Cannot verify.';
        }

        setContactEmail(currentContactEmail);
        setObjectId(currentObjectId);
        setError(currentError);

        if (properties.kickbox_result) {
          let verificationDateValue = properties.kickbox_verification_date;
          if (typeof verificationDateValue === 'string' && !isNaN(parseFloat(verificationDateValue)) && parseFloat(verificationDateValue).toString() === verificationDateValue) {
              verificationDateValue = parseFloat(verificationDateValue);
          }

          setVerificationResult({
            result: properties.kickbox_result || '',
            reason: properties.kickbox_reason || 'N/A',
            disposable: properties.kickbox_disposable === 'true',
            accept_all: properties.kickbox_accept_all === 'true',
            role: properties.kickbox_role === 'true',
            free: properties.kickbox_free === 'true',
            sendex: parseFloat(properties.kickbox_sendex) || 0,
            did_you_mean: properties.kickbox_did_you_mean || null,
            success: properties.kickbox_success === 'true',
            email_normalized: properties.kickbox_email_normalized || null,
            verification_date: verificationDateValue || null,
            verified_email: properties.kickbox_email_normalized || null
          });
        } else {
          setVerificationResult(null);
        }
      })
      .catch(err => {
        console.error('Error fetching CRM properties:', err);
        setError('Failed to load contact data. Please refresh.');
        setContactEmail('Error loading email.');
        setObjectId('N/A');
      });

  }, [actions.fetchCrmObjectProperties]);

  const runKickboxVerification = async () => {
    if (!contactEmail || contactEmail === 'N/A' || contactEmail === 'Loading contact email...' || contactEmail === 'No email found.') {
      setError('No valid email to verify.');
      return;
    }

    if (!objectId || objectId === 'N/A') {
      setError('Cannot verify: Contact ID is missing.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const response = await runServerlessFunction({
        name: "verify-email",
        parameters: {
          email: contactEmail,
          contactId: objectId
        }
      });

      console.log("Serverless Function Raw Response:", response);

      if (response.status === 'SUCCESS') {
        let resultData;
        try {
          resultData = typeof response.response.body === 'string' ? JSON.parse(response.response.body) : response.response.body;
        } catch (e) {
          console.error("Error parsing serverless success response body:", e, response.response.body);
          setError("Verification succeeded, but could not parse response data. Check console logs for details.");
          setIsLoading(false);
          return;
        }

        console.log("Parsed Serverless Data (resultData):", resultData);

        setVerificationResult({
          result: resultData.kickbox_result || '',
          reason: resultData.kickbox_reason || 'N/A',
          disposable: typeof resultData.kickbox_disposable === 'boolean' ? resultData.kickbox_disposable : String(resultData.kickbox_disposable).toLowerCase() === 'true',
          accept_all: typeof resultData.kickbox_accept_all === 'boolean' ? resultData.kickbox_accept_all : String(resultData.kickbox_accept_all).toLowerCase() === 'true',
          role: typeof resultData.kickbox_role === 'boolean' ? resultData.kickbox_role : String(resultData.kickbox_role).toLowerCase() === 'true',
          free: typeof resultData.kickbox_free === 'boolean' ? resultData.kickbox_free : String(resultData.kickbox_free).toLowerCase() === 'true',
          sendex: typeof resultData.kickbox_sendex === 'number' ? resultData.kickbox_sendex : parseFloat(resultData.kickbox_sendex) || 0,
          did_you_mean: resultData.kickbox_did_you_mean || null,
          success: typeof resultData.kickbox_success === 'boolean' ? resultData.kickbox_success : String(resultData.kickbox_success).toLowerCase() === 'true',
          email_normalized: resultData.kickbox_email_normalized || null,
          verification_date: resultData.kickbox_verification_date || null,
          verified_email: resultData.kickbox_email_normalized || null
        });

        actions.addAlert({
          type: 'success',
          message: resultData.message || 'Email verified and contact updated successfully!'
        });
        setError(null);

        if (actions && typeof actions.refreshObjectProperties === 'function') {
           actions.refreshObjectProperties([
             'kickbox_result', 'kickbox_reason', 'kickbox_disposable', 'kickbox_accept_all',
             'kickbox_role', 'kickbox_free', 'kickbox_sendex', 'kickbox_did_you_mean',
             'kickbox_success', 'kickbox_email_normalized', 'kickbox_verification_date', 'kickbox_verified_email'
           ]);
            console.log("Called actions.refreshObjectProperties()");

        } else {
          console.warn("actions.refreshObjectProperties not available or not a function. Cannot refresh CRM properties.");
        }

      } else {
        let errorData;
        try {
          errorData = typeof response.response === 'string' ? JSON.parse(response.response) : response.response;
        } catch (e) {
          console.error("Error parsing serverless error response:", e, response.response);
          setError("Verification failed, and could not parse error response. Check logs.");
          return;
        }
        console.error('Serverless function failed:', errorData.message);
        setError(`Verification failed: ${errorData.message || 'Unknown error. Check serverless function logs.'}`);
        actions.addAlert({
          type: 'danger',
          message: `Verification failed: ${errorData.message || 'Please check serverless function logs.'}`
        });
      }

    } catch (err) {
      console.error('Error calling serverless function:', err);
      setError('An unexpected error occurred during verification.');
      actions.addAlert({
        type: 'danger',
        message: 'An unexpected error occurred during verification.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading ||
                           !contactEmail || contactEmail === 'N/A' || contactEmail === 'Loading contact email...' || contactEmail === 'No email found.' ||
                           !objectId || objectId === 'N/A';

  return (
    <Box padding="large" margin="large">
      <Heading size="md">
        Kickbox Email Verification
      </Heading>

      {error && (
        <Alert title="Error!" variant="danger" margin="medium">
          <Text>{error}</Text>
        </Alert>
      )}

      <Divider />

      <Box padding="large" margin="bottom">
        <Flex direction="column" gap="extraSmall">
          <Text format={{ fontWeight: "bold" }}>
            Contact Email:
          </Text>
          <Box padding="extraSmall"> 
            <Text>{contactEmail}</Text>
          </Box>
        </Flex>
      </Box>

      <Button
        onClick={runKickboxVerification}
        disabled={isButtonDisabled}
        variant="primary"
        loading={isLoading}
        margin="medium"
        style={{ width: '100%', padding: '12px 16px' }}
      >
        {isLoading ? 'Verifying...' : 'Verify Email with Kickbox'}
      </Button>

      <Divider />

      {verificationResult && (
        <Box padding="medium" margin="large">
          <Heading size="sm" margin="bottom">
            Verification Results:
          </Heading>

          <Flex direction="column" gap="medium">

            {/* Row 1: Status & Reason */}
            <Flex direction="row" gap="medium" wrap="wrap" justify="space-between">
                <Box grow={1}>
                    <Text format={{ fontWeight: "bold" }}>Status:</Text>{' '}
                    {(() => {
                        const result = verificationResult.result || '';
                        switch (result.toLowerCase()) {
                            case 'deliverable':
                                return <StatusTag variant="success">{result.toUpperCase()}</StatusTag>;
                            case 'undeliverable':
                                return <StatusTag variant="danger">{result.toUpperCase()}</StatusTag>;
                            case 'risky':
                                return <StatusTag variant="warning">{result.toUpperCase()}</StatusTag>;
                            case 'unknown':
                                return <StatusTag variant="neutral">{result.toUpperCase()}</StatusTag>;
                            default:
                                return <StatusTag variant="default">{result.toUpperCase()}</StatusTag>;
                        }
                    })()}
                </Box>
                <Box grow={2}>
                    <Text><Text format={{ fontWeight: "bold" }}>Reason:</Text> {verificationResult.reason ? verificationResult.reason.replace(/_/g, ' ') : 'N/A'}</Text>
                </Box>
                <Box grow={2}>
                <Text><Text format={{ fontWeight: "bold" }}>Sendex Score:</Text> {typeof verificationResult.sendex === 'number' ? (verificationResult.sendex * 100).toFixed(2) : 'N/A'}%</Text>
                </Box>
            </Flex>

            <Divider />

            <Flex direction="row" gap="medium" wrap="wrap" justify="space-between">
                <Box grow={1} basis="48%">
                {verificationResult.success !== undefined && (
                   <Text><Text format={{ fontWeight: "bold" }}>Success:</Text> {verificationResult.success ? 'Yes' : 'No'}</Text>
                )}
                </Box>
                <Box grow={1} basis="48%">
                    <Text><Text format={{ fontWeight: "bold" }}>Disposable:</Text> {verificationResult.disposable ? 'Yes' : 'No'}</Text>
                </Box>
                <Box grow={1} basis="48%">
                    <Text><Text format={{ fontWeight: "bold" }}>Accept All:</Text> {verificationResult.accept_all ? 'Yes' : 'No'}</Text>
                </Box>
                <Box grow={1} basis="48%">
                    <Text><Text format={{ fontWeight: "bold" }}>Role Email:</Text> {verificationResult.role ? 'Yes' : 'No'}</Text>
                </Box>
                <Box grow={1} basis="48%">
                    <Text><Text format={{ fontWeight: "bold" }}>Free Email Provider:</Text> {verificationResult.free ? 'Yes' : 'No'}</Text>
                </Box>
            </Flex>

            <Divider />

            <Flex direction="row" gap="small">
                
                {verificationResult.did_you_mean && (
                    <Text><Text format={{ fontWeight: "bold" }}>Did You Mean?:</Text> {verificationResult.did_you_mean}</Text>
                )}
                {verificationResult.verification_date && (
                    <Text><Text format={{ fontWeight: "bold" }}>Verification Date:</Text> {new Date(verificationResult.verification_date).toLocaleString()}</Text>
                )}
                {verificationResult.verified_email && (
                  <Text><Text format={{ fontWeight: "bold" }}>Verified Email:</Text>{verificationResult.verified_email}</Text>
                )}
            </Flex>

          </Flex>
        </Box>
      )}
    </Box>
  );
};

hubspot.extend((props) => <EmailVerificationCard {...props} />);