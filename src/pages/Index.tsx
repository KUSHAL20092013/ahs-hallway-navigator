
import { useState } from "react";
import { ImageMap } from "@/components/ImageMap";
import { PositioningStatus } from "@/components/PositioningStatus";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-subtle">
      {/* Mobile-first header */}
      <header className="bg-card shadow-[--shadow-card] border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-patriotic bg-clip-text text-transparent">
              School Navigator
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Navigate your school with precision
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Map section - full width on mobile */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="card-mobile animate-fade-in h-full">
              <ImageMap />
            </div>
          </div>
          
          {/* Positioning status - top on mobile */}
          <div className="order-1 lg:order-2">
            <div className="animate-fade-in animation-delay-200">
              <PositioningStatus />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;