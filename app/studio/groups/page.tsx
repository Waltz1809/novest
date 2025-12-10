import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyGroups } from "@/actions/translation-group";
import TranslationGroupManager from "@/components/studio/translation-group-manager";

export default async function TranslationGroupsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const groups = await getMyGroups();

    return <TranslationGroupManager groups={groups} />;
}
