// LinkedIn OAuth callback for Company Page connections.
// Distinct from social-oauth-callback (personal): uses LINKEDIN_PAGES_CLIENT_ID
// / LINKEDIN_PAGES_CLIENT_SECRET and looks up organizations the user
// administers. Called by LinkedIn directly via GET redirect.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function appRedirect(path: string): string {
  const explicit = Deno.env.get("APP_URL");
  const base = explicit ? explicit.replace(/\/$/, "") : "https://buildwithmoxiemo.com";
  return `${base}${path}`;
}

async function fetchOrgName(accessToken: string, orgUrn: string): Promise<string | null> {
  // orgUrn looks like urn:li:organization:12345678
  const id = orgUrn.split(":").pop();
  if (!id) return null;
  try {
    const res = await fetch(
      `https://api.linkedin.com/rest/organizations/${id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": "202405",
        },
      },
    );
    if (!res.ok) {
      // Fallback to legacy v2 endpoint
      const legacy = await fetch(
        `https://api.linkedin.com/v2/organizations/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      );
      if (!legacy.ok) return null;
      const j = await legacy.json();
      return j?.localizedName ?? j?.vanityName ?? null;
    }
    const j = await res.json();
    return j?.localizedName ?? j?.vanityName ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateRaw = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");

    if (oauthError) {
      return Response.redirect(
        appRedirect(`/app/settings?pages_error=${encodeURIComponent(oauthError)}#integrations-section`),
        302,
      );
    }
    if (!code || !stateRaw) {
      return new Response("Missing code or state", { status: 400, headers: corsHeaders });
    }

    const state = JSON.parse(atob(stateRaw));
    const { user_id: userId, redirect_uri: redirectUri } = state ?? {};
    if (!userId || !redirectUri) {
      return new Response("Invalid state", { status: 400, headers: corsHeaders });
    }

    const clientId = Deno.env.get("LINKEDIN_PAGES_CLIENT_ID");
    const clientSecret = Deno.env.get("LINKEDIN_PAGES_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      console.error("Missing LINKEDIN_PAGES_CLIENT_ID / LINKEDIN_PAGES_CLIENT_SECRET");
      return Response.redirect(appRedirect(`/app/settings?pages_error=not_configured#integrations-section`), 302);
    }

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error("Pages token exchange failed", tokenRes.status, txt);
      return Response.redirect(appRedirect(`/app/settings?pages_error=token_exchange_failed#integrations-section`), 302);
    }
    const token = await tokenRes.json();
    const accessToken = token.access_token as string;
    const expiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    // Look up organizations the user administers.
    const aclsRes = await fetch(
      "https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": "202405",
        },
      },
    );

    let orgUrns: string[] = [];
    if (aclsRes.ok) {
      const acls = await aclsRes.json();
      orgUrns = (acls?.elements ?? [])
        .map((el: any) => el?.organization)
        .filter((v: any) => typeof v === "string");
    } else {
      // Fallback to legacy v2 endpoint if the rest one fails.
      const legacyRes = await fetch(
        "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      );
      if (legacyRes.ok) {
        const acls = await legacyRes.json();
        orgUrns = (acls?.elements ?? [])
          .map((el: any) => el?.organizationalTarget ?? el?.organization)
          .filter((v: any) => typeof v === "string");
      } else {
        const txt = await legacyRes.text();
        console.error("organizationAcls failed", legacyRes.status, txt);
        return Response.redirect(
          appRedirect(`/app/settings?pages_error=acl_lookup_failed#integrations-section`),
          302,
        );
      }
    }

    const orgs: { organization_id: string; organization_name: string; urn: string }[] = [];
    for (const urn of orgUrns) {
      const id = urn.split(":").pop() ?? "";
      const name = (await fetchOrgName(accessToken, urn)) ?? `Organization ${id}`;
      orgs.push({ organization_id: id, organization_name: name, urn });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (orgs.length === 0) {
      return Response.redirect(
        appRedirect(`/app/settings?pages_error=no_pages_found#integrations-section`),
        302,
      );
    }

    if (orgs.length === 1) {
      const org = orgs[0];
      const { error: upsertErr } = await supabase
        .from("social_connections")
        .upsert(
          {
            user_id: userId,
            platform: "linkedin",
            connection_type: "company",
            organization_id: org.organization_id,
            organization_name: org.organization_name,
            access_token: accessToken,
            refresh_token: token.refresh_token ?? null,
            expires_at: expiresAt,
            profile_name: org.organization_name,
          },
          { onConflict: "user_id,platform,connection_type,organization_id" },
        );
      if (upsertErr) {
        console.error("company connection upsert failed", upsertErr);
        return Response.redirect(
          appRedirect(`/app/settings?pages_error=save_failed#integrations-section`),
          302,
        );
      }
      return Response.redirect(
        appRedirect(`/app/settings?pages_connected=1#integrations-section`),
        302,
      );
    }

    // Multiple orgs — stash into pending_pages_connections and let the UI pick.
    const { error: pendErr } = await supabase
      .from("pending_pages_connections")
      .upsert(
        {
          user_id: userId,
          access_token: accessToken,
          refresh_token: token.refresh_token ?? null,
          expires_at: expiresAt,
          organizations: orgs,
        },
        { onConflict: "user_id" },
      );
    if (pendErr) {
      console.error("pending pages upsert failed", pendErr);
      return Response.redirect(
        appRedirect(`/app/settings?pages_error=save_failed#integrations-section`),
        302,
      );
    }

    return Response.redirect(
      appRedirect(`/app/settings?pages_select=pending#integrations-section`),
      302,
    );
  } catch (err) {
    console.error("social-oauth-pages-callback error", err);
    return Response.redirect(
      appRedirect(`/app/settings?pages_error=callback_failed#integrations-section`),
      302,
    );
  }
});