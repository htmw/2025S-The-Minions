import { clerkMiddleware } from "@clerk/nextjs/server";

// Configure public paths that should bypass authentication
const publicPaths = [
  "/",
  "/auth/login",
  "/auth/register", 
  "/auth/success",
  "/api/ml/analyze-chest",
  "/auth/login/sso-callback",  // Add this SSO callback path
  "/auth/register/sso-callback"  // Also add register SSO callback
];

export default clerkMiddleware({
  beforeAuth: (req) => {
    // Check if the URL pathname is in the public paths
    const url = new URL(req.url);
    const isPublicPath = publicPaths.some(path => 
      url.pathname === path || url.pathname.startsWith(`${path}/`)
    );
    
    if (isPublicPath) {
      return;
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};