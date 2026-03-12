import { cultClient, setSSOToken } from "@/lib/cult-client";

interface CultAuthResult {
  cultUserId: string;
  name: string;
  supabaseTokens: {
    access_token: string;
    refresh_token: string;
    user_id: string;
  };
}

export const validateSSOToken = async (ssoToken: string | null, ignoreAuth?: boolean): Promise<CultAuthResult> => {
  if (!ssoToken && !ignoreAuth) {
    throw new Error("No SSO token provided");
  }

  setSSOToken(ssoToken);

  const cultData = await cultClient.post("/v2/user/ninja-10x/details");
  console.log("[SSO] Cult API response received", cultData);

  const cultUserId = cultData?.userId ? String(cultData.userId) : null;
  if (!cultUserId || cultUserId === "undefined") {
    throw new Error("Could not extract cult user ID from API response");
  }

  const name = [cultData.firstName, cultData.lastName].filter(Boolean).join(" ") || "";
  const profileImageUrl = cultData.profileImageUrl || null;

  const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-cult-user`;

  const bridgeResponse = await fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ cultUserId, name, profileImageUrl }),
  });

  if (!bridgeResponse.ok) {
    const errorText = await bridgeResponse.text().catch(() => "Unknown error");
    throw new Error(`Auth bridge failed: ${errorText}`);
  }

  const data = await bridgeResponse.json();

  return {
    cultUserId: data.cult_user_id,
    name: data.name,
    supabaseTokens: {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user_id: data.user_id,
    },
  };
};
