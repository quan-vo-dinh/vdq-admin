import { PersonalizedIntro } from "@/app/components/shared/personalized-intro";
import UserProfile from "@/app/components/user-profile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "user-profile",
};


const Notes = () => {

  return (
    <>
        <div className="pb-4"><PersonalizedIntro taglineOnly /></div>
        <UserProfile/>
    </>
  );
};

export default Notes;
