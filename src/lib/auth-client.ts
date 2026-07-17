import { inferAdditionalFields } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import type { auth } from "@/lib/auth"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  // Type-only inference of the server's additionalFields (user.locale) so
  // signUp/updateUser accept them; the import is erased at build time.
  plugins: [inferAdditionalFields<typeof auth>()],
})

export const {
  signIn,
  signOut,
  signUp,
  updateUser,
  useSession,
  getSession,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
} = authClient
