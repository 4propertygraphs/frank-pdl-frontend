import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "sharebank",
  private_key_id: "3a47299cc59ed1553264dd8a5764b9742e8c512e",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDVOPJFDFkM0tgD\ntNgLocoZodcgX0txwxdxKPzgNj3bB8ym9sWyhmFwh15Js/mcUdaW9HnAyQPIAgHn\nSVjJdu7dMQ7u8bL9lzK01LtaeVzY6bIkbBfpZ2onAKUbQ8yymruthRKpSM9gtLJF\nScyMjJ15EAKWZK8fYjxRkl68i/HkV7Sewr/xzipg39/xYQGOa0WlmB+OfFwh0/AD\nu+M/MbLijrALWOGxQQRzPsYK++wEzsq2PM9DMLS63hx16qtfm0gVIN43b7ROryYU\nlvz8D5uuIVvCIS1vs1amBDQvk0QwlwrNRKbj/JWBE/pe1nm2hMFtJ8zNpsotEO9M\n16idn9kdAgMBAAECggEADiFefjCcdtWYPDKlaKvu//YyPV0jW6WBWF342DEFYLkV\nGRwx1iwX/q7x6DIrAMQ0U5UIZpF2adr8M6QwOUsOTGP+aIZlsBmaN31WRzTTcDVD\nOYJdA/pMViEG+sC/quHHPe9w4P1yxNFkyQ5kJbesje5/hWZPFruEt3va7GWH1nPR\n0K7N1y86WcbSsURktgwJkns2LjgxpiQtyHj7Lkj2yQyBIlPKNSwjmWj9Vwn7m5oS\ncfclPDTt59B7dwTcb9zDZm1k8Dfw4XvPXsUNrQJkykbwnrInKfT0giwUEm65bRJd\nr59O4/zGQXBdwt5dPbxP6jtR4YAjYh1ki6KVcQST0QKBgQD5ilgKi8xrZx/aP2KY\nEBUg582jOgL1Cx2xLWkfuEYf2kF0Hf2ihKF7OHIoJ4p7jpoHiWQWAGbA40PMXuQ8\n7k44bI+/TVDRKDs7qbbDxrwAzvazjHKFsqJAqAricYsb40s1+xeDJr0J6hWJqjc5\ndR+YEk6WiL4XMx2AjSAj5abstQKBgQDave4rjPveh5EigNwPL66NHmlbgLBigDhy\nD0k+x/mgzgJsp1Ocj+mDa78Qkg2Ut3SV03a4BaAqPgDllF5CY5hB1luyWq4D3jx1\ncyv1dZIOp9C0vyu2H8APjMm/YsKzhKBrUsBZctKfpbt6lZdHAiVgTBHC5gTpCDBm\nXhRoia5jyQKBgCUMVxnpu4XOn7oFYxv0d06VW8B6ImpDJjth5JOjBjZAbytQMJHq\nYxcqQDiZ9kN13oRz73ocwSSuGSjEhdpN/yr9YzIhxnfnIzQudEYIwWzVTWdG2NHk\nvZYf3M3V0bNoQYhYKRt9qt9H876mmOBc9T3cqfJLhv1mx2CIk1cBB5FpAoGAV9nq\nGuGfkqsd1h6swwiicRjitZZEwPrAMMcE4ssL7dJvVNYLFZkS7u5KKUyPWcgocbgh\nOR1BS1XlpE7nYICBeQevgj07IGCUJZOg9w9GHs61WrJgyt+LknM33765dcHxb8kn\naYVdJDM6zavguusYuckzZPReyny4e5STW7zYJkkCgYAmNTrKFxcyWJ+F+8sHC2M6\npskOZQY/w5TJnO8J+jU1YVtTSSg4e3dhTp4wcK77+UBHDoKdR+qIPi4Ol8G7rd8y\nZR437CEbYBgY4IwbMCKrpZQjuUApYAk3zNSVlvg/GwpnMpsmWh1qyxrGFmt7x7GI\nNylO41Ro9uFI98G6lWWCvg==\n-----END PRIVATE KEY-----\n",
  client_email: "sharebank@sharebank.iam.gserviceaccount.com",
  client_id: "117920036834701275268",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/sharebank%40sharebank.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function getAccessToken(): Promise<string> {
  const jwtHeader = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtClaim = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: SCOPES.join(' '),
    aud: SERVICE_ACCOUNT.token_uri,
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = btoa(JSON.stringify(jwtHeader)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedClaim = btoa(JSON.stringify(jwtClaim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const privateKeyPem = SERVICE_ACCOUNT.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${encodedSignature}`;

  const tokenResponse = await fetch(SERVICE_ACCOUNT.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function uploadToGoogleDrive(file: File, folderId: string, accessToken: string) {
  const metadata = {
    name: file.name,
    parents: [folderId]
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: form
    }
  );

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string;

    if (!file || !folderId) {
      return new Response(
        JSON.stringify({ error: 'File and folderId are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const accessToken = await getAccessToken();
    const result = await uploadToGoogleDrive(file, folderId, accessToken);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});