
import { useState } from "react";
import { ImageMap } from "@/components/ImageMap";
import { PositioningStatus } from "@/components/PositioningStatus";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-subtle flex flex-col">
      {/* Position Status at the top */}
      <div className="bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="flex-1">
            <PositioningStatus />
          </div>
        </div>
      </div>

      {/* Map */}
      <main className="flex-1 p-4">
        <div className="w-full h-full">
          <div className="card-mobile animate-fade-in h-full">
            <ImageMap />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;