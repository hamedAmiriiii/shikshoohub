"use client"
import { LoginButton } from '@telegram-auth/react';

export default function LoginButtonB2() {
    return (
        <div className="App">
            <LoginButton
                botUsername="HamedSissBot"
                onAuthCallback={(data) => {
                    // call your backend here to validate the data and sign in the user
                }}
            />
        </div>
    );
}
