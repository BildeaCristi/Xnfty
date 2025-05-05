"use client";

import WalletSignIn from "./wallet-signin-button";
import GoogleSignIn from "./google-signin-button";

export default function SignIn() {
    return (
        <div className="flex flex-col gap-8 justify-center items-center py-4">
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full">
                <GoogleSignIn />
                <WalletSignIn />
            </div>
        </div>
    );
}
