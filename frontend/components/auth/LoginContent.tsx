"use client";

import WalletLogin from "./WalletLoginButton";
import GoogleLoginButton from "./GoogleLoginButton";

export default function LoginContent() {
    return (
     <div className="flex flex-col gap-8 justify-center items-center py-4">
         <div className="flex flex-col gap-4 justify-center items-center w-full">
             <span className="text-lg font-medium">Connect as guest</span>
             <GoogleLoginButton />
             <span className="text-lg font-medium">Connect as user</span>
             <WalletLogin />
         </div>
     </div>
    );
}
