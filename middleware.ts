import { auth } from "@/auth"

export default auth

export const config = {
    // Chạy middleware trên tất cả các route, TRỪ các file tĩnh (ảnh, favicon...)
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}