import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CULT_API_BASE = "https://stage.cult.fit/api";
const CULT_API_KEY = "f09dc9b7-70af-4d4b-b241-0288755352c3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    let cultUserId: string;
    let name: string;
    let email: string | null;
    let phone: string | null;
    let profileImageUrl: string | null = null;

    if (body.ssoToken) {
      // Server-side Cult API validation (alternative path)
      const cultResponse = await fetch(`${CULT_API_BASE}/user/ninja-10x/details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CULT_API_KEY,
          ssotoken: body.ssoToken,
        },
        body: JSON.stringify({}),
      });

      if (!cultResponse.ok) {
        const errorText = await cultResponse.text().catch(() => "Unknown error");
        console.error("Cult API error:", cultResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: `Cult API validation failed: ${cultResponse.status}` }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cultData = await cultResponse.json();

      cultUserId = cultData?.userId ? String(cultData.userId) : "";
      if (!cultUserId || cultUserId === "undefined") {
        return new Response(
          JSON.stringify({ error: "Could not extract cult user ID from API response" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      name = [cultData.firstName, cultData.lastName].filter(Boolean).join(" ") || "";
      email = cultData.email || null;
      phone = cultData.phoneNumber || null;
      profileImageUrl = cultData.profileImageUrl || null;
    } else if (body.cultUserId) {
      // Client already validated — just bridge to Supabase
      cultUserId = body.cultUserId;
      name = body.name || "";
      email = body.email || null;
      phone = body.phone || null;
      profileImageUrl = body.profileImageUrl || null;
    } else {
      return new Response(
        JSON.stringify({ error: "ssoToken or cultUserId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Deterministic credentials from cultUserId
    const deterministicEmail = `cult_${cultUserId}@cultfit.internal`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(serviceRoleKey);
    const msgData = encoder.encode(cultUserId);

    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const deterministicPassword = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Try sign-in first; if user doesn't exist, sign up
    let session: any;
    const { data: signInData, error: signInError } =
      await adminClient.auth.signInWithPassword({
        email: deterministicEmail,
        password: deterministicPassword,
      });

    if (signInError) {
      const { data: signUpData, error: signUpError } =
        await adminClient.auth.signUp({
          email: deterministicEmail,
          password: deterministicPassword,
          options: {
            data: { cult_user_id: cultUserId, display_name: name || "" },
          },
        });

      if (signUpError) throw signUpError;
      session = signUpData.session;
    } else {
      session = signInData.session;
    }

    if (!session) throw new Error("No session returned");

    // Upsert profile — only set avatar_url if profileImageUrl is present
    // and profile has no avatar yet
    const profileUpsertData: Record<string, any> = {
      user_id: session.user.id,
      cult_user_id: cultUserId,
      display_name: name || "Athlete",
      email: email || null,
      phone: phone || null,
    };

    // Check if profile already has an avatar set
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", session.user.id)
      .maybeSingle();

    // Set avatar_url from profileImageUrl if profile doesn't have one yet
    if (!existingProfile?.avatar_url && profileImageUrl) {
      profileUpsertData.avatar_url = profileImageUrl;
    } else if (!existingProfile) {
      profileUpsertData.avatar_url = profileImageUrl || "";
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(profileUpsertData, { onConflict: "user_id" });

    if (profileError) console.error("Profile upsert error:", profileError);

    return new Response(
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user_id: session.user.id,
        cult_user_id: cultUserId,
        name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Auth bridge error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
