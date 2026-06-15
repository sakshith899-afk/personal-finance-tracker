import { getSupabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase select error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data ?? []);
  } catch (err) {
    console.error("GET /api/transactions failed:", err);
    return Response.json(
      { error: "Failed to load transactions" },
      { status: 500 }
    );
  }
}
