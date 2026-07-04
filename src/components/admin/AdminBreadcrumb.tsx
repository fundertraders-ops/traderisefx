import { Link, useRouterState } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface AdminBreadcrumbProps {
  currentPage: string;
}

export function AdminBreadcrumb({ currentPage }: AdminBreadcrumbProps) {
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  });

  return (
    <div className="min-w-0 flex-1 overflow-x-auto">
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap whitespace-nowrap text-xs sm:text-sm">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className="font-semibold">
                Trade Rise <span className="text-gold-gradient">FX</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {currentPath !== "/admin" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate max-w-[140px] sm:max-w-none">
                  {currentPage}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
