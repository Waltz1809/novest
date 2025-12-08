import { getGenresWithCount } from "@/actions/genre";
import GenresClient from "./genres-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function GenresPage() {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/");
    }

    const genres = await getGenresWithCount();

    return <GenresClient genres={genres} />;
}
