
import { useState } from "react";
import { ImageMap } from "@/components/ImageMap";
import { PositioningStatus } from "@/components/PositioningStatus";
import { FloorPlanSidebar } from "@/components/FloorPlanSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-gradient-subtle flex">
        {/* Floor Plan Editor Sidebar */}
        <FloorPlanSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Position Status at the top */}
          <div className="bg-card border-b border-border">
            <div className="flex items-center gap-3 px-4 py-2">
              <SidebarTrigger className="h-8 w-8 p-0 border-primary/20 hover:bg-primary/5 border rounded-md" />
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
      </div>
    </SidebarProvider>
  );
};

export default Index;