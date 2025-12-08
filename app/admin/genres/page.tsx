import { getGenresWithCount } from "@/actions/genre";
import GenresClient from "./genres-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function GenresPage() {
    const session = await auth();
    const isAdminOrMod = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
    if (!session?.user || !isAdminOrMod) {
        redirect("/");
    }

    const genres = await getGenresWithCount();

    return <GenresClient genres={genres} />;
}
