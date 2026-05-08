import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center">
        <Image 
          src="/brand/polis-wordmark.svg" 
          alt="Polis" 
          width={140} 
          height={40} 
          className="h-8 w-auto mb-8" 
          priority
        />
        <SignIn />
      </div>
    </div>
  );
}
