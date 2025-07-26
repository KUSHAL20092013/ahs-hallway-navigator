
import { ImageMap } from "@/components/ImageMap";
import { PositioningStatus } from "@/components/PositioningStatus";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ImageMap />
          </div>
          <div className="space-y-4">
            <PositioningStatus />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;