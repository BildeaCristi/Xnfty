import { handleLogout } from "@/actions";

export default function SignOut() {
    return (
        <form
            action={async () => {
                await handleLogout();
            }}
            className="w-full"
        >
            <button
                type="submit"
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-300"
            >
                Sign Out
            </button>
        </form>
    );
}