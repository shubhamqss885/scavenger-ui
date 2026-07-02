"use client";
import React from "react";
import { Icon } from "@/components/ui/icon";

const LoadingView: React.FC = () => {
  return (
    <div className="absolute w-full h-full flex-1 flex justify-center items-center top-0 left-0">
      <Icon
        name="LoaderCircle"
        className="w-12 h-12 animate-spin"
        variant="primary"
      />
    </div>
  );
};

export const LoadingViewFull: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
      <Icon
        name="LoaderCircle"
        className="w-12 h-12 animate-spin"
        variant="primary"
      />
      <div className="spinner" />
    </div>
  );
};

export default LoadingView;
