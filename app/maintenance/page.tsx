"use client";

import { Clock, Settings } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-lg w-full text-center">
        {/* Logo/Brand Area */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings
              className="w-10 h-10 text-white animate-spin"
              style={{ animationDuration: "3s" }}
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            We&apos;ll be right back
          </h1>
          <p className="text-lg text-slate-600">
            Scavenger is currently undergoing scheduled maintenance
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <p className="text-slate-700 mb-8 leading-relaxed">
            We&apos;re performing scheduled maintenance to improve your
            experience. Our team is working to get everything back online as
            quickly as possible.
          </p>

          {/* Estimated Time */}
          <div className="flex items-center justify-center space-x-2 text-slate-600 mb-6">
            <Clock className="w-5 h-5" />
            <span>Expected to be back online soon</span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center space-x-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-slate-700 font-medium">
              Maintenance in progress
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-slate-500 text-sm">
          <p>Thank you for your patience</p>
        </div>
      </div>
    </div>
  );
}
