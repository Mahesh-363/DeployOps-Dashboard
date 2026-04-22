import { corsHeaders } from '@supabase/supabase-js/cors'

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
  const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
  const AWS_REGION = Deno.env.get('AWS_REGION') || 'eu-west-1';

  if (!AWS_ACCESS_KEY_ID) {
    return new Response(JSON.stringify({ error: 'AWS_ACCESS_KEY_ID not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!AWS_SECRET_ACCESS_KEY) {
    return new Response(JSON.stringify({ error: 'AWS_SECRET_ACCESS_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, pipelineName } = await req.json();

    if (!action || !pipelineName) {
      return new Response(JSON.stringify({ error: 'Missing action or pipelineName' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // AWS Signature V4 helpers
    const encoder = new TextEncoder();

    async function hmacSHA256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
      const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
    }

    async function sha256(message: string): Promise<string> {
      const hash = await crypto.subtle.digest('SHA-256', encoder.encode(message));
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function getSignatureKey(key: string, dateStamp: string, region: string, service: string) {
      let kDate = await hmacSHA256(encoder.encode('AWS4' + key), dateStamp);
      let kRegion = await hmacSHA256(kDate, region);
      let kService = await hmacSHA256(kRegion, service);
      return await hmacSHA256(kService, 'aws4_request');
    }

    // Build AWS API request
    const service = 'codepipeline';
    const host = `${service}.${AWS_REGION}.amazonaws.com`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    let target = '';
    let body = '';

    switch (action) {
      case 'listPipelines':
        target = 'CodePipeline_20150709.ListPipelines';
        body = '{}';
        break;
      case 'getPipelineState':
        target = 'CodePipeline_20150709.GetPipelineState';
        body = JSON.stringify({ name: pipelineName });
        break;
      case 'listPipelineExecutions':
        target = 'CodePipeline_20150709.ListPipelineExecutions';
        body = JSON.stringify({ pipelineName, maxResults: 10 });
        break;
      case 'startPipelineExecution':
        target = 'CodePipeline_20150709.StartPipelineExecution';
        body = JSON.stringify({ name: pipelineName });
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const payloadHash = await sha256(body);
    const canonicalHeaders = `content-type:application/x-amz-json-1.1\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${target}\n`;
    const signedHeaders = 'content-type;host;x-amz-date;x-amz-target';
    const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const credentialScope = `${dateStamp}/${AWS_REGION}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;

    const signingKey = await getSignatureKey(AWS_SECRET_ACCESS_KEY, dateStamp, AWS_REGION, service);
    const signatureBuffer = await hmacSHA256(signingKey, stringToSign);
    const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const awsResponse = await fetch(`https://${host}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Date': amzDate,
        'X-Amz-Target': target,
        'Authorization': authorizationHeader,
      },
      body,
    });

    const data = await awsResponse.json();

    if (!awsResponse.ok) {
      return new Response(JSON.stringify({ error: `AWS API error [${awsResponse.status}]`, details: data }), {
        status: awsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('AWS CodePipeline error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

Deno.serve(handler);
