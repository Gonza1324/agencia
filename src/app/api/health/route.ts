import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      service: "control-agencia",
      status: "ok",
      version: "1.0.0",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
