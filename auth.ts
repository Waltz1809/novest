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
        Google({
            allowDangerousEmailAccountLinking: true
        }),
        Discord({
            allowDangerousEmailAccountLinking: true
        }),
        GitHub({
            allowDangerousEmailAccountLinking: true
        }),
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

                // Check if user is banned
                if (user.isBanned) {
                    return null; // Block banned users from logging in
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
                    username: user.username,
                    emailVerified: user.emailVerified,
                };
            }
        })
    ],
    callbacks: {
        // Block banned users from signing in via OAuth
        async signIn({ user }) {
            if (!user.id) return true; // New user, allow

            const dbUser = await db.user.findUnique({
                where: { id: user.id },
                select: { isBanned: true }
            });

            if (dbUser?.isBanned) {
                return false; // Block banned users
            }

            return true;
        },
        async jwt({ token, user, trigger, session }) {
            // Persist user data in JWT token
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.nickname = user.nickname;
                token.username = user.username;
                token.picture = user.image;
                token.emailVerified = user.emailVerified;
            }

            if (trigger === "update" && session) {
                token.nickname = session.user.nickname;
                token.username = session.user.username;
                token.picture = session.user.image;
                if (session.user.emailVerified !== undefined) {
                    token.emailVerified = session.user.emailVerified;
                }
            }

            return token;
        },
        async session({ session, token }) {
            // Add user data to session object
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.nickname = token.nickname as string | null;
                session.user.username = token.username as string | null;
                session.user.image = token.picture as string | null;
                session.user.emailVerified = token.emailVerified as Date | null;
            }
            return session;
        },
    },
    events: {
        async createUser({ user }) {
            if (!user.email || !user.id) return;

            // Generate username from email
            const emailPrefix = user.email.split('@')[0];
            let username = emailPrefix.replace(/[^a-zA-Z0-9_]/g, ''); // Sanitize

            // Check for collision
            const existingUser = await db.user.findUnique({
                where: { username }
            });

            if (existingUser) {
                // Append 4 random digits
                const randomDigits = Math.floor(1000 + Math.random() * 9000);
                username = `${username}_${randomDigits}`;
            }

            // Update user with generated username
            await db.user.update({
                where: { id: user.id },
                data: { username }
            });
        }
    },
    pages: {
        signIn: '/login',
        newUser: '/welcome' // Redirect new users to onboarding
    },
    session: {
        strategy: "jwt"
    }
})
