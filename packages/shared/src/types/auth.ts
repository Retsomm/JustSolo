import { z } from "zod";

export const signInWithGoogleInputSchema = z.object({
  idToken: z.string(),
});

export type SignInWithGoogleInput = z.infer<typeof signInWithGoogleInputSchema>;
