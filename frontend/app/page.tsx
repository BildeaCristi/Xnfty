import {auth} from "@/auth";
import {ROUTES} from "@/config/routes";
import {redirect} from "next/navigation";

export default async function Home() {
    const session = await auth();

    if (session) {
        redirect(ROUTES.DASHBOARD as string);
    } else {
        redirect(ROUTES.LOGIN as string);
    }
}