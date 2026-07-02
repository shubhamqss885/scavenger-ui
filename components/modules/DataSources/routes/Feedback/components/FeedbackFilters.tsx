"use client";

import { useTranslation } from "@/lib/i18n/client";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icon } from "@/components/ui/icon";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { cn } from "@/lib/utils";
import { FeedbackFiltersState } from "../hooks/useFeedbackData";

// Parse yyyy-MM-dd as local time (not UTC) to avoid off-by-one day shift
const parseLocalDate = (dateStr: string) => new Date(dateStr + "T00:00:00");

type FeedbackFiltersProps = Readonly<{
  filters: FeedbackFiltersState;
  onFiltersChange: (filters: Partial<FeedbackFiltersState>) => void;
  availableEmails: string[];
}>;

export function FeedbackFilters({
  filters,
  onFiltersChange,
  availableEmails,
}: FeedbackFiltersProps) {
  const { t } = useTranslation("database");

  const hasActiveFilters =
    filters.feedbackType !== "all" ||
    filters.feedbackValue !== "with_rating" ||
    filters.startDate ||
    filters.endDate ||
    filters.userEmails.length > 0 ||
    filters.resolutionStatus !== "all";

  const handleReset = () => {
    onFiltersChange({
      feedbackType: "all",
      feedbackValue: "with_rating",
      startDate: null,
      endDate: null,
      userEmails: [],
      resolutionStatus: "all",
    });
  };

  const emailOptions = availableEmails.map((email) => ({
    value: email.toLowerCase(),
    label: email,
  }));

  return (
    <div className="flex items-center gap-3">
      {/* Type Filter */}
      <Select
        value={filters.feedbackType}
        onValueChange={(value) =>
          onFiltersChange({
            feedbackType: value as FeedbackFiltersState["feedbackType"],
          })
        }
      >
        <SelectTrigger className="h-7 w-[130px]">
          <SelectValue placeholder={t("feedbackTab.filters.allTypes")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">
            {t("feedbackTab.filters.allTypes")}
          </SelectItem>
          <SelectItem value="chat" className="text-xs">
            {t("feedbackTab.filters.chat")}
          </SelectItem>
          <SelectItem value="text_to_sql" className="text-xs">
            {t("feedbackTab.filters.textToSql")}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Rating Filter */}
      <Select
        value={filters.feedbackValue}
        onValueChange={(value) =>
          onFiltersChange({
            feedbackValue: value as FeedbackFiltersState["feedbackValue"],
          })
        }
      >
        <SelectTrigger className="h-7 w-[120px]">
          <SelectValue placeholder={t("feedbackTab.filters.allRatings")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="with_rating" className="text-xs">
            {t("feedbackTab.filters.allRatings")}
          </SelectItem>
          <SelectItem value="+1" className="text-xs">
            {t("feedbackTab.filters.positive")}
          </SelectItem>
          <SelectItem value="-1" className="text-xs">
            {t("feedbackTab.filters.negative")}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* User Email Filter */}
      <MultiCombobox
        options={emailOptions}
        selected={filters.userEmails}
        onSelectedChange={(values) => onFiltersChange({ userEmails: values })}
        placeholder={t("feedbackTab.filters.allUsers")}
        searchPlaceholder={t("feedbackTab.filters.searchUsers")}
        emptyText={t("feedbackTab.filters.noUsers")}
        className="h-7 w-[180px]"
      />

      {/* Status Filter */}
      <Select
        value={filters.resolutionStatus}
        onValueChange={(value) =>
          onFiltersChange({
            resolutionStatus: value as FeedbackFiltersState["resolutionStatus"],
          })
        }
      >
        <SelectTrigger className="h-7 w-[110px]">
          <SelectValue placeholder={t("feedbackTab.filters.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open" className="text-xs">
            {t("feedbackTab.filters.open")}
          </SelectItem>
          <SelectItem value="resolved" className="text-xs">
            {t("feedbackTab.filters.resolved")}
          </SelectItem>
          <SelectItem value="all" className="text-xs">
            {t("feedbackTab.filters.allStatuses")}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          {t("feedbackTab.filters.startDate")}
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-7 w-[120px] justify-start px-2 text-left text-xs font-normal",
                !filters.startDate && "text-muted-foreground",
              )}
            >
              <Icon name="Calendar" size="xs" className="mr-2" />
              {filters.startDate
                ? format(parseLocalDate(filters.startDate), "MMM d, yyyy")
                : "Select"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto border-border p-0" align="start">
            <Calendar
              mode="single"
              selected={
                filters.startDate
                  ? parseLocalDate(filters.startDate)
                  : undefined
              }
              onSelect={(date) =>
                onFiltersChange({
                  startDate: date ? format(date, "yyyy-MM-dd") : null,
                })
              }
              disabled={
                filters.endDate
                  ? { after: parseLocalDate(filters.endDate) }
                  : undefined
              }
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          {t("feedbackTab.filters.endDate")}
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-7 w-[120px] justify-start px-2 text-left text-xs font-normal",
                !filters.endDate && "text-muted-foreground",
              )}
            >
              <Icon name="Calendar" size="xs" className="mr-2" />
              {filters.endDate
                ? format(parseLocalDate(filters.endDate), "MMM d, yyyy")
                : "Select"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto border-border p-0" align="start">
            <Calendar
              mode="single"
              selected={
                filters.endDate ? parseLocalDate(filters.endDate) : undefined
              }
              onSelect={(date) =>
                onFiltersChange({
                  endDate: date ? format(date, "yyyy-MM-dd") : null,
                })
              }
              disabled={
                filters.startDate
                  ? { before: parseLocalDate(filters.startDate) }
                  : undefined
              }
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 text-muted-foreground hover:text-foreground"
        >
          {t("feedbackTab.filters.reset")}
        </Button>
      )}
    </div>
  );
}
