import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("emotional_events")
    .insert({
      emotion: body.emotion,
      timestamp: body.timestamp,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    received: data,
  });
}