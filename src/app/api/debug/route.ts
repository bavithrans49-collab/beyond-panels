import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const results: Record<string, any> = {};

  try {
    results.dbConnection = "attempting...";
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    results.dbConnection = "ok";
    results.queryTest = result;

    results.comics = "attempting...";
    const comics = await prisma.comic.findMany({ take: 1 });
    results.comics = `ok, found ${comics.length}`;
  } catch (error: any) {
    results.error = {
      message: error.message,
      name: error.name,
      stack: error.stack?.split("\n").slice(0, 5).join("\n"),
    };
  }

  results.env = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL?.substring(0, 50),
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
    DATABASE_URL_set: !!process.env.DATABASE_URL,
  };

  return NextResponse.json(results);
}
