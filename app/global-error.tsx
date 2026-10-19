"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          background: "#fafafa",
          color: "#0a0a0a",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ textTransform: "uppercase", letterSpacing: 2 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#525252", maxWidth: 420 }}>
          We&apos;re having trouble loading the site. Please try again in a
          moment.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 16,
            padding: "10px 20px",
            background: "#0a0a0a",
            color: "#fff",
            border: 0,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}