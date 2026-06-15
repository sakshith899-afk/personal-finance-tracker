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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, description, category, amount } = body ?? {};

    if (!description || amount == null || isNaN(Number(amount))) {
      return Response.json(
        { error: "description and a numeric amount are required" },
        { status: 400 }
      );
    }

    const row = {
      date: date || new Date().toISOString().slice(0, 10),
      description: String(description),
      category: category || "others",
      amount: Number(amount),
      source: "manual",
      raw_input: "[manual entry]",
    };

    const { data, error } = await getSupabase()
      .from("transactions")
      // @ts-expect-error - Supabase types are generated from your project schema
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/transactions failed:", err);
    return Response.json({ error: "Failed to add transaction" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/transactions failed:", err);
    return Response.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
