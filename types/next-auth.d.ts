import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: string // Thêm dòng này
        } & DefaultSession["user"]
    }

    interface User {
        role: string // Thêm dòng này
    }
}