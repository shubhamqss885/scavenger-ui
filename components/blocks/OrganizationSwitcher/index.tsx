import { useState, useRef, useEffect, useCallback } from "react";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useOrganizationDbData } from "@/lib/context/OrganizationDbProvider";
import { OrganizationDetails } from "@/lib/services/organizationService";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Virtuoso } from "react-virtuoso";
import { cn } from "@/lib/utils";
import { Subtle } from "@/components/ui/typography";
import { useTranslation } from "@/lib/i18n/client";

type OrganizationSwitcherProps = Readonly<{
  onOrganizationChange?: () => void;
  trigger?: React.ReactNode;
}>;

const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  onOrganizationChange,
  trigger,
}) => {
  const {
    organizationDetails,
    userOrganizationProfile,
    fetchAllOrganizationsPage,
    switchOrganization,
    isLoading: contextLoading,
  } = useOrgFeatures();
  const { isAddingDb } = useOrganizationDbData();
  const { t } = useTranslation("home");
  const router = useRouter();

  // Block switching while a switch is loading or a data source is being added.
  const isDisabled = contextLoading || isAddingDb;

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(
    userOrganizationProfile?.current_organization || "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [organizations, setOrganizations] = useState<OrganizationDetails[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const PAGE_SIZE = 10;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to page 1 when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchOrganizations = useCallback(async () => {
    setIsLoadingOrgs(true);
    setError(null);
    try {
      const response = await fetchAllOrganizationsPage(
        currentPage,
        PAGE_SIZE,
        debouncedSearch || undefined,
        false, // is_private = false, only fetch enterprise orgs
      );
      setOrganizations(response.data);
      setTotalPages(response.pagination.total_pages);
    } catch (err) {
      console.error("Error fetching organizations:", err);
      // Extract error message from backend response
      let errorMessage = "Failed to load organizations";
      if (err instanceof AxiosError && err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      setError(errorMessage);
      setOrganizations([]);
    } finally {
      setIsLoadingOrgs(false);
    }
  }, [currentPage, debouncedSearch, fetchAllOrganizationsPage]);

  // Fetch organizations when page or search changes
  useEffect(() => {
    if (open) {
      fetchOrganizations();
    }
  }, [open, fetchOrganizations]);

  // Focus search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  // Close the popover if switching becomes disabled while it's open.
  useEffect(() => {
    if (isDisabled && open) {
      setOpen(false);
    }
  }, [isDisabled, open]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Don't show if no user profile, but show skeleton if loading
  if (!userOrganizationProfile && !contextLoading) return null;

  // Show skeleton while loading
  if (contextLoading && !userOrganizationProfile) {
    return <Skeleton className="h-9 flex-1 rounded-md" />;
  }

  const renderContent = () => {
    if (isLoadingOrgs) {
      return (
        <div className="my-1 flex h-[300px] items-center justify-center">
          <Icon name="Loader2" size="sm" className="animate-spin opacity-50" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="my-1 flex h-[300px] flex-col items-center justify-center px-4 text-center text-xs">
          <Icon name="AlertCircle" size="sm" className="mb-2 opacity-50" />
          <Subtle>{error}</Subtle>
        </div>
      );
    }

    if (organizations.length === 0) {
      return (
        <div className="my-1 flex h-[300px] flex-col items-center justify-center text-center text-xs">
          <Icon name="Search" size="sm" className="mb-2 opacity-50" />
          <Subtle>No organization found.</Subtle>
        </div>
      );
    }

    return (
      <div className="my-1 flex-1">
        <Virtuoso
          style={{ height: "300px" }}
          className="overflow-x-hidden"
          totalCount={organizations.length}
          itemContent={(index) => {
            const org = organizations[index];
            const isSelected = value === org.org_id;

            return (
              <div className="px-1 py-px">
                <Button
                  variant="ghost"
                  size="default"
                  key={org.org_id}
                  onClick={async () => {
                    setOpen(false);
                    setValue(org.org_id);
                    router.push("/home");
                    await switchOrganization(org.org_id);
                    onOrganizationChange?.();
                  }}
                  className={cn(
                    "align-start relative h-auto w-full justify-start truncate rounded-sm px-2 py-1.5 text-xs font-normal",
                    isSelected && "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="truncate">{org.organization_name}</span>
                  <Icon
                    name="Check"
                    size="xs"
                    className={cn(
                      "ml-auto shrink-0",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </Button>
              </div>
            );
          }}
          overscan={5}
        />
      </div>
    );
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Don't open while disabled (blocks mouse and keyboard).
        if (!isDisabled) setOpen(next);
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            {/* Wrapper carries the tooltip + dimming for either trigger. */}
            <span
              className={cn(
                "inline-flex",
                !trigger && "flex-1",
                isDisabled && "cursor-not-allowed opacity-50",
              )}
              aria-disabled={isDisabled || undefined}
            >
              {trigger || (
                <Button
                  variant="outline"
                  aria-haspopup="listbox"
                  aria-expanded={open}
                  aria-controls="organization-list"
                  disabled={isDisabled}
                  className="flex-1 justify-between px-3 font-normal"
                >
                  <span
                    className={cn(
                      "truncate",
                      !value && "text-muted-foreground",
                    )}
                  >
                    {organizationDetails?.organization_name ||
                      "Select organization"}
                  </span>
                  <Icon
                    name="ChevronDown"
                    size="xs"
                    className={cn(
                      "opacity-50 transition-transform duration-200",
                      open && "rotate-180",
                    )}
                  />
                </Button>
              )}
            </span>
          </PopoverTrigger>
        </TooltipTrigger>
        {isAddingDb && (
          <TooltipContent>
            {t("sidebar.orgSwitcher.disabledWhileAddingDb")}
          </TooltipContent>
        )}
      </Tooltip>
      <PopoverContent
        className="w-[258px] border border-input p-0 shadow-sm"
        align="end"
      >
        <div className="flex h-full w-full flex-col rounded-md bg-popover text-popover-foreground">
          {/* Search Input */}
          <div className="relative flex items-center border-b p-1">
            <Icon
              name="Search"
              size="xs"
              className="absolute left-3 top-[13px] mr-2 shrink-0 opacity-50"
            />
            <Input
              ref={searchInputRef}
              placeholder="Search enterprise organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-md px-0 pl-7 shadow-none focus-visible:ring-0"
            />
          </div>

          {/* Organization List */}
          {renderContent()}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t bg-muted/30 px-1 py-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoadingOrgs || totalPages <= 1}
              className="h-7 w-7 min-w-7"
            >
              <Icon name="ChevronLeft" size="xs" className="" />
            </Button>
            <Subtle className="text-[11px]">
              {totalPages > 1 ? (
                <>
                  Page {currentPage} of {totalPages}
                </>
              ) : (
                <span className="opacity-50">1 page</span>
              )}
            </Subtle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={
                currentPage === totalPages || isLoadingOrgs || totalPages <= 1
              }
              className="h-7 w-7 min-w-7"
            >
              <Icon name="ChevronRight" size="xs" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OrganizationSwitcher;
