// Mock for next/server
export class NextResponse {
    static json(data: unknown, init?: { status?: number }) {
        return {
            json: () => Promise.resolve(data),
            status: init?.status || 200,
        };
    }
}

export class NextRequest {
    url: string;
    constructor(url: string) {
        this.url = url;
    }
}
