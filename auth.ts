import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import Google from "next-auth/providers/google"
import Discord from "next-auth/providers/discord"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(db) as any,
    providers: [
        Google,
        Discord,
        GitHub,
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                // Validate credentials
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (!parsedCredentials.success) {
                    return null;
                }

                const { email, password } = parsedCredentials.data;

                // Find user by email
                const user = await db.user.findUnique({
                    where: { email }
                });

                if (!user || !user.password) {
                    return null;
                }

                // Verify password
                const isPasswordValid = await bcrypt.compare(password, user.password);

                if (!isPasswordValid) {
                    return null;
                }

                // Return user object (password excluded)
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role,
                    nickname: user.nickname,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Persist user data in JWT token
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.nickname = user.nickname;
            }
            return token;
        },
        async session({ session, token }) {
            // Add user data to session object
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.nickname = token.nickname as string | null;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login', // You can customize this
    },
    session: {
        strategy: "jwt"
    }
})
