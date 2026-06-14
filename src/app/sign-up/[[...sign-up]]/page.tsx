import { SignUp } from "@clerk/nextjs";
import { PolisMark } from "@/components/brand/polis-mark";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center">
        <PolisMark className="mb-8 text-foreground" iconClassName="h-8 w-8" textClassName="h-7" priority />
        <SignUp />
      </div>
    </div>
  );
}
