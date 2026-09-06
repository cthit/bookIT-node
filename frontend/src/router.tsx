import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { CalendarDays, LogOut, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/user";
import { useLanguage } from "@/lib/language";
import { Failure, Loading } from "@/components/feedback";
import { bookingSearchDate } from "@/lib/dates";

function Layout() {
  const user = useUser();
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    if (user.data?.locale && !localStorage.getItem("bookit-language")) {
      setLanguage(user.data.locale.startsWith("sv") ? "sv" : "en");
    }
  }, [user.data?.locale, setLanguage]);

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3"
      >
        {t("Skip to content", "Till innehållet")}
      </a>
      <header className="bg-white border-b">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-12 flex items-center justify-between min-h-20 gap-4">
          <div className="flex items-center gap-2 sm:gap-12">
            <Link to="/" aria-label="BookIT home" className="flex items-center gap-2.5">
              <span className="size-9 rounded-lg bg-brand text-primary-foreground grid place-items-center">
                <CalendarDays className="size-5" />
              </span>
              <span className="hidden sm:inline text-2xl tracking-tight font-bold">
                book<span className="text-accent-foreground">IT</span>
              </span>
            </Link>
            <nav aria-label={t("Main navigation", "Huvudnavigation")} className="flex gap-1">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                className="rounded-md px-3 py-2 text-sm font-medium"
              >
                {t("Calendar", "Kalender")}
              </Link>
              <Link
                to="/rules"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                className="rounded-md px-3 py-2 text-sm font-medium"
              >
                {t("Rules", "Regler")}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label={t("Switch to Swedish", "Byt till engelska")}
              onClick={() => setLanguage(language === "en" ? "sv" : "en")}
            >
              {language === "en" ? "SV" : "EN"}
            </Button>
            <div className="hidden md:flex text-sm items-center gap-2 border-l pl-4 ml-2">
              {user.data?.is_admin && <ShieldCheck className="size-4 text-accent-foreground" />}
              {user.data?.nickname || user.data?.name || user.data?.cid}
            </div>
            <Button variant="ghost" size="icon" asChild>
              <a href="/api/logout" aria-label={t("Sign out", "Logga ut")}>
                <LogOut className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>
      <main id="content" className="app-shell">
        {user.isPending ? (
          <Loading />
        ) : user.error ? (
          <Failure error={user.error} retry={() => void user.refetch()} />
        ) : (
          <Outlet />
        )}
      </main>
    </>
  );
}

const rootRoute = createRootRoute({
  component: Layout,
  notFoundComponent: () => (
    <div className="text-center p-12">
      <h1 className="page-title">404</h1>
      <p className="my-5">Page not found / Sidan hittades inte</p>
      <Link to="/">Back to calendar</Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => <Failure error={error} retry={reset} />,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazyRouteComponent(() => import("@/pages/calendar"), "CalendarPage"),
});

const newRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/new-event",
  validateSearch: (search: Record<string, unknown>): { start?: string; end?: string } => ({
    start: bookingSearchDate(search.start),
    end: bookingSearchDate(search.end),
  }),
  component: lazyRouteComponent(() => import("@/pages/booking"), "NewBookingPage"),
});

const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bookings/$id",
  validateSearch: (search: Record<string, unknown>): { edit: boolean } => ({
    edit: search.edit === true || search.edit === "true",
  }),
  component: lazyRouteComponent(() => import("@/pages/booking"), "BookingPage"),
});

const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rules",
  component: lazyRouteComponent(() => import("@/pages/rules"), "RulesPage"),
});

const legacyEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/edit-event",
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (search.id) {
      throw redirect({
        to: "/bookings/$id",
        params: { id: search.id },
        search: { edit: true },
        replace: true,
      });
    }

    throw redirect({ to: "/", replace: true });
  },
});

export const router = createRouter({
  scrollRestoration: true,
  routeTree: rootRoute.addChildren([homeRoute, newRoute, detailRoute, rulesRoute, legacyEditRoute]),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
