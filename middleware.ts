import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = [
	'/dashboard',
	'/loans',
	'/loans/add',
	'/changepassword',
	'/admin',
];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
	if (!isProtected) {
		return NextResponse.next();
	}

	const session = request.cookies.get('session_token');
	if (!session) {
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('redirect', pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


