"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return (
      <main style={{ padding: 40 }}>
        <h1>YouTube Companion Dashboard</h1>
        <button onClick={() => signIn("google")}>
          Sign in with Google
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Welcome 🎉</h1>
      <p>Signed in as:</p>
      <pre>{JSON.stringify(session.user, null, 2)}</pre>

      <button onClick={() => signOut()}>
        Sign out
      </button>
    </main>
  );
}
