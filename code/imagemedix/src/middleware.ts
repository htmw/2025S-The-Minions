import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher([
  "/",
  "/auth/login(.*)",  
  "/auth/register(.*)",  
  "/auth/success",
  "/api/ml/analyze-chest"
]);

export default clerkMiddleware({
  beforeAuth: (req) => {
    if (isPublic(req)) {
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