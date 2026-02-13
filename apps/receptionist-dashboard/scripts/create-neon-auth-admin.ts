/**
 * Script to create admin user via direct HTTP calls to Neon Auth API
 *
 * This bypasses the Next.js SDK to work from a standalone script
 *
 * Usage: bun run scripts/create-neon-auth-admin.ts
 */

import "dotenv/config";

const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL;
const ADMIN_EMAIL = "admin@globalfit.com.mx";
const ADMIN_PASSWORD = "admin123!";
const ADMIN_NAME = "Admin";

async function createAdminUser() {
  if (!NEON_AUTH_BASE_URL) {
    console.error("ERROR: NEON_AUTH_BASE_URL environment variable is required");
    process.exit(1);
  }

  console.log("Creating admin user via Neon Auth HTTP API...");
  console.log("Auth URL:", NEON_AUTH_BASE_URL);
  console.log("Email:", ADMIN_EMAIL);

  // First, try to sign up the user
  const signUpUrl = `${NEON_AUTH_BASE_URL}/sign-up/email`;
  console.log("\nAttempting sign-up at:", signUpUrl);

  try {
    const signUpResponse = await fetch(signUpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://dashboard.globalfit.com.mx",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
      }),
    });

    console.log("Sign-up status:", signUpResponse.status);
    const signUpData = await signUpResponse.json();
    console.log("Sign-up response:", JSON.stringify(signUpData, null, 2));

    if (signUpResponse.ok && (signUpData as any).user) {
      console.log("\nSUCCESS: Admin user created successfully!");
      console.log("User ID:", (signUpData as any).user?.id);
      console.log("\nYou can now log in with:");
      console.log("  Email:", ADMIN_EMAIL);
      console.log("  Password:", ADMIN_PASSWORD);
      return;
    }

    // Check for "user already exists" error
    const errorCode = (signUpData as any).code || "";
    const errorMessage = (signUpData as any).message || "";

    if (
      errorCode === "USER_ALREADY_EXISTS" ||
      errorMessage.includes("already exists") ||
      signUpResponse.status === 409
    ) {
      console.log("\nUser already exists. Attempting sign-in to verify password...");

      const signInUrl = `${NEON_AUTH_BASE_URL}/sign-in/email`;
      const signInResponse = await fetch(signInUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://dashboard.globalfit.com.mx",
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        }),
      });

      console.log("Sign-in status:", signInResponse.status);
      const signInData = await signInResponse.json();
      console.log("Sign-in response:", JSON.stringify(signInData, null, 2));

      if (signInResponse.ok && (signInData as any).user) {
        console.log("\nSUCCESS: Admin user exists and password is correct!");
        console.log("User ID:", (signInData as any).user?.id);
        console.log("\nYou can now log in with:");
        console.log("  Email:", ADMIN_EMAIL);
        console.log("  Password:", ADMIN_PASSWORD);
        return;
      }

      console.log("\nWARNING: User exists but password does not match.");
      console.log("The user in Neon Auth was created with a different password.");
      console.log("\nOptions to fix:");
      console.log("1. Go to Neon Console and delete the user:");
      console.log("   https://console.neon.tech/app/projects/");
      console.log("   Then run this script again.");
      console.log("\n2. Or update the password directly in Neon Console.");
      return;
    }

    console.error("\nERROR: Unexpected response from sign-up");
    process.exit(1);
  } catch (error) {
    console.error("\nERROR: Request failed");
    console.error(error);
    process.exit(1);
  }
}

createAdminUser();
