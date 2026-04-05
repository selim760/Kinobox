import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_SECRET_CODE = "KINOBOX-ADMIN-2024";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, adminCode } = await req.json();

    if (!email || !password || !adminCode) {
      return new Response(
        JSON.stringify({ error: "Все поля обязательны" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (adminCode !== ADMIN_SECRET_CODE) {
      return new Response(
        JSON.stringify({ error: "Неверный код администратора" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Try to create user; if already exists, look up existing user
    let userId: string;
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        // User exists — find them and assign admin role
        const { data: listData, error: listError } = await adminClient.auth.admin.listUsers();
        if (listError) {
          return new Response(
            JSON.stringify({ error: "Не удалось найти пользователя" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const existingUser = listData.users.find((u: any) => u.email === email);
        if (!existingUser) {
          return new Response(
            JSON.stringify({ error: "Пользователь не найден" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        userId = existingUser.id;
      } else {
        console.error("Auth error:", authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      userId = authData.user.id;
    }

    // Assign admin role (upsert to handle existing user)
    const { error: roleError } = await adminClient
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

    if (roleError) {
      console.error("Role error:", roleError);
      return new Response(
        JSON.stringify({ error: "Аккаунт создан, но не удалось назначить роль админа" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Роль администратора назначена! Теперь вы можете войти." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("register-admin error:", e);
    return new Response(
      JSON.stringify({ error: "Внутренняя ошибка сервера" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
