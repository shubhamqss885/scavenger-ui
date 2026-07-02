import { useSidebar } from "@/components/ui/sidebar";
import { IconLogo } from "@/lib/icons";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import Image from "next/image";
import { Link } from "next-view-transitions";
import { IconLogoWordmark } from "@/lib/icons/logo-wordmark";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  OrganizationBrandingProps,
  ScavengerBrandingProps,
} from "./SidebarLogo.types";

// Constants
const LOGO_DIMENSIONS = {
  expanded: { width: 120, height: 36 },
  collapsed: { width: 32, height: 32 },
} as const;

const CLASSNAMES = {
  container:
    "flex items-center justify-between transition-all duration-150 ease-in-out p-2.5 mt-0.5",
  link: "flex items-center justify-start transition-spacing duration-150 ease-in-out",
  text: "text-xl mt-0.5 truncate font-inter font-extrabold transition-all duration-300 ease-in-out",
} as const;

const OrganizationBranding: React.FC<OrganizationBrandingProps> = ({
  logoUrl,
  organizationName,
  letter,
  isExpanded,
}) => {
  return (
    <div className="relative flex items-center">
      {/* Logo - visible when expanded */}
      <div
        className={`flex h-9 w-auto min-w-6 items-center justify-center transition-all duration-150 ease-in-out ${
          isExpanded ? "opacity-100" : "pointer-events-none absolute opacity-0"
        }`}
      >
        <Image
          src={logoUrl}
          alt={organizationName}
          width={LOGO_DIMENSIONS.expanded.width}
          height={LOGO_DIMENSIONS.expanded.height}
          className="object-contain"
          style={{
            maxHeight: `${LOGO_DIMENSIONS.expanded.height}px`,
            width: "auto",
            maxWidth: `${LOGO_DIMENSIONS.expanded.width}px`,
          }}
          priority
        />
      </div>
      {/* Monogram - visible when collapsed */}
      <h1
        className={`${CLASSNAMES.text} ml-1 w-auto py-[3px] text-primary transition-all duration-150 ease-in-out ${
          isExpanded ? "pointer-events-none absolute opacity-0" : "opacity-100"
        }`}
      >
        {letter}
      </h1>
    </div>
  );
};

const ScavengerBranding: React.FC<ScavengerBrandingProps> = ({
  isExpanded,
}) => {
  return isExpanded ? (
    <IconLogoWordmark className="h-[27px] w-auto text-slate-900" />
  ) : (
    <IconLogo className="h-6 w-6 min-w-6 text-slate-900" />
  );
};

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="ml-1 mt-0.5 flex items-center justify-center p-2.5">
      <Skeleton className="h-6 w-6 min-w-6 flex-grow rounded-md" />
    </div>
  );
};

// Main Component
export const SidebarLogo: React.FC = () => {
  const { open } = useSidebar();
  const { organizationDetails, homeRoute, isLoading } = useOrgFeatures();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const hasOrgLogo = !!organizationDetails?.logo_image_url;
  const orgLetter =
    organizationDetails?.organization_name?.charAt(0).toUpperCase() || "";

  const renderLogo = () => {
    if (!hasOrgLogo) {
      return <ScavengerBranding isExpanded={open} />;
    }

    return (
      <OrganizationBranding
        logoUrl={organizationDetails.logo_image_url}
        organizationName={organizationDetails.organization_name}
        letter={orgLetter}
        isExpanded={open}
      />
    );
  };

  return (
    <div className={`${CLASSNAMES.container} ${open ? "ml-1" : ""}`}>
      <Link
        href={homeRoute}
        className={`${CLASSNAMES.link} ${open ? "gap-2" : "ml-1 gap-0"}`}
      >
        {renderLogo()}
      </Link>
    </div>
  );
};
