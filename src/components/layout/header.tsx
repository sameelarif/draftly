import { SignedIn, UserButton } from "@clerk/nextjs";
import { FlipWords } from "../ui/flip-words";

export function Header() {
  return (
    <header className="flex col-span-6 rounded-lg justify-between items-center p-4 bg-gray-800 text-white">
      <div className="text-2xl font-bold">
        Draftly&nbsp;
        <span className="text-gray-200 text-sm font-normal">
          for
          <FlipWords
            className="text-gray-200 font-normal"
            duration={2000}
            words={[
              "students",
              "researchers",
              "content creators",
              "marketers",
              "copywriters",
            ]}
          />
        </span>
      </div>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
