import { FC } from "react";
import cx from "classnames";
import { twMerge } from "tailwind-merge";

type Props = {
  className?: string;
};

export const IconLogo: FC<Props> = ({ className }) => {
  const baseClass = cx({
    "w-6 h-6": true,
  });
  const finalClasses = twMerge(baseClass, className);

  return (
    <svg
      className={finalClasses}
      viewBox="0 0 1920 1920"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1007.81 1009C1245.71 1020.61 1471.51 1120.23 1640.72 1289.44C1693.52 1342.24 1739.53 1400.54 1778.22 1463C1617.11 1725.16 1333.83 1904 1007.81 1920V1009Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M913.987 1918.92C676.076 1907.31 450.275 1807.69 281.059 1638.47C150.612 1508.02 61.5257 1343.95 22.2313 1166.62C7.67418 1100.08 5.47743e-05 1030.96 0 960.044C0 444.668 405.161 24.0365 913.987 -0.00292969V1918.92ZM601.105 473.153C513.184 473.153 441.908 544.429 441.908 632.35C441.909 720.271 513.184 791.545 601.105 791.545C689.026 791.544 760.299 720.271 760.3 632.35C760.3 544.429 689.026 473.153 601.105 473.153Z"
        fill="currentColor"
      />
      <path
        d="M1007.81 0.0820906C1515.79 25.0244 1920 445.274 1920 960.044C1920 1106.38 1887.33 1245.07 1828.91 1369.21C1793.02 1317.3 1752.31 1268.36 1707.06 1223.11C1520.25 1036.3 1270.61 926.766 1007.81 915.084V0.0820906Z"
        fill="currentColor"
      />
    </svg>
  );
};
