import MainHeader from "@/components/layout/main-header";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <MainHeader />
            {children}
        </>
    );
}
