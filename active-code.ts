import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DURATION_MAP: Record<string, number> = {
  "7_days": 7,
  "1_month": 30,
  "6_months": 180,
  "12_months": 365,
};

const DURATION_LABEL: Record<string, string> = {
  "7_days": "7 дней",
  "1_month": "1 месяц",
  "6_months": "6 месяцев",
  "12_months": "12 месяцев",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Не авторизован" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Не авторизован" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Код не указан" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Find code
    const { data: codeRow, error: findError } = await adminClient
      .from("activation_codes")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (findError || !codeRow) {
      return new Response(JSON.stringify({ error: "Неверный код или уже использован" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (codeRow.is_used) {
      return new Response(JSON.stringify({ error: "Неверный код или уже использован" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate expiry
    const days = DURATION_MAP[codeRow.duration] || 30;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Mark code as used
    const { error: updateCodeError } = await adminClient
      .from("activation_codes")
      .update({ is_used: true, used_by: user.id, used_at: now.toISOString() })
      .eq("id", codeRow.id);

    if (updateCodeError) {
      return new Response(JSON.stringify({ error: "Ошибка активации" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update user profile
    const { error: updateProfileError } = await adminClient
      .from("profiles")
      .update({
        subscription: "premium",
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("id", user.id);

    if (updateProfileError) {
      return new Response(JSON.stringify({ error: "Ошибка обновления профиля" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const label = DURATION_LABEL[codeRow.duration] || codeRow.duration;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Премиум активирован: ${label}, до ${expiresAt.toLocaleDateString("ru-RU")}`,
        subscription: "premium",
        duration: label,
        expires_at: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("activate-code error:", e);
    return new Response(JSON.stringify({ error: "Внутренняя ошибка сервера" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
