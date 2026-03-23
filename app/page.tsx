import { redirect } from "next/navigation";
import { getUserProfile } from "@/utils/auth";

export default async function HomePage() {
  const profile = await getUserProfile();

  redirect(profile ? "/dashboard/materials" : "/login");
}
