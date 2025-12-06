import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const { nextUrl, auth: session } = req
    const pathname = nextUrl.pathname

    // Routes that completely bypass middleware
    const bypassRoutes = ['/api', '/_next', '/favicon.ico', '/opengraph-image']

    if (bypassRoutes.some(r => pathname.startsWith(r)) ||
        pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|mp4|webm)$/)) {
        return NextResponse.next()
    }

    // Protected routes that require a username to be set
    const protectedRoutes = [
        '/studio',        // Creator Studio
        '/tu-truyen',     // User's library
        '/admin',         // Admin panel
    ]

    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    )

    // /u/{username}/settings is also protected
    const isSettingsRoute = pathname.match(/^\/u\/[^/]+\/settings/)

    // Only redirect to /welcome if user has NO username at all
    // Users with any username (even auto-generated) can access protected routes
    if ((isProtectedRoute || isSettingsRoute) && session?.user) {
        const username = session.user.username

        // Redirect only if username is null, undefined, or empty string
        if (!username || username.trim() === '') {
            return NextResponse.redirect(new URL('/welcome', nextUrl.origin))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
