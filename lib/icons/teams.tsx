import { FC } from "react";
import cx from "classnames";
import { twMerge } from "tailwind-merge";

type Props = {
  className?: string;
};

export const IconTeams: FC<Props> = ({ className }) => {
  const baseClass = cx({
    "h-4 w-4": true,
  });
  const finalClasses = twMerge(baseClass, className);

  return (
    <svg
      className={finalClasses}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.404 4.478c0 1.242-1.005 2.249-2.246 2.249s-2.246-1.007-2.246-2.249a2.247 2.247 0 0 1 2.246-2.249c1.241 0 2.246 1.007 2.246 2.249zM24 8.418v5.678c0 1.747-1.395 3.164-3.115 3.164h-.153c-1.72 0-3.115-1.417-3.115-3.164v-5.21h3.398A2.886 2.886 0 0 1 24 8.418zm-7.598 6.26V7.553a5.037 5.037 0 0 0-.435-2.055h2.392a2.73 2.73 0 0 1 2.722 2.722v5.678c0 2.328-1.748 4.248-3.998 4.524A4.534 4.534 0 0 1 16.402 14.678zM13.5 4.228c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zM4.499 8.718h7.002A2.5 2.5 0 0 1 14 11.218v5.5a4.501 4.501 0 0 1-9.001 0v-5.5a2.5 2.5 0 0 1 2.5-2.5z" />
    </svg>
  );
};
