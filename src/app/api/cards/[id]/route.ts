import { NextResponse } from "next/server";

import { createClient } from "@/server/db/client";

type CardEdit = {
  prompt?: string;
  answer?: string;
  options?: string[];
  correct_index?: number;
  explanation?: string;
};

/** Edit a card. Students fix the occasional wrong or clumsy one. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: card } = await supabase
    .from("cards")
    .select("id, type, options")
    .eq("id", id)
    .single();
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

  const body = (await request.json()) as CardEdit;
  const update: CardEdit = {};

  if (body.prompt !== undefined) {
    if (!body.prompt.trim()) {
      return NextResponse.json({ error: "The question cannot be empty." }, { status: 400 });
    }
    if (card.type === "fill_blank" && body.prompt.split("___").length !== 2) {
      return NextResponse.json(
        { error: "A fill-in-the-blank sentence needs exactly one ___ in it." },
        { status: 400 },
      );
    }
    update.prompt = body.prompt.trim();
  }

  if (body.answer !== undefined) update.answer = body.answer.trim();
  if (body.explanation !== undefined) update.explanation = body.explanation.trim();

  if (body.options !== undefined) {
    const options = body.options.map((o) => o.trim()).filter(Boolean);
    if (card.type === "mcq" && options.length < 2) {
      return NextResponse.json({ error: "Keep at least two options." }, { status: 400 });
    }
    update.options = options;
  }

  if (body.correct_index !== undefined) {
    const options = update.options ?? (card.options as string[]);
    if (body.correct_index < 0 || body.correct_index >= options.length) {
      return NextResponse.json({ error: "Pick one of the options." }, { status: 400 });
    }
    update.correct_index = body.correct_index;
    update.answer = options[body.correct_index];
  }

  const { error } = await supabase.from("cards").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ updated: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
