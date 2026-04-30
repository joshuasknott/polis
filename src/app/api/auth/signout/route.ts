import { signOut } from "@/lib/auth";

export async function POST() {
  return signOut();
}

export async function GET() {
  return signOut();
}
