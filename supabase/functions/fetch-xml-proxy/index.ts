const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const sitePrefix = url.searchParams.get('sitePrefix');
    const siteId = url.searchParams.get('siteId') || '0';

    if (!sitePrefix) {
      return new Response(
        JSON.stringify({ error: 'Missing sitePrefix parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const xmlUrl = `https://www.acquaintcrm.co.uk/datafeeds/standardxml/${sitePrefix.toUpperCase()}-${siteId}.xml`;
    console.log('Fetching XML from:', xmlUrl);

    const xmlResponse = await fetch(xmlUrl);
    
    if (!xmlResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch XML: ${xmlResponse.status}` }),
        {
          status: xmlResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const xmlText = await xmlResponse.text();

    return new Response(xmlText, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
      },
    });
  } catch (error: any) {
    console.error('Error fetching XML:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});