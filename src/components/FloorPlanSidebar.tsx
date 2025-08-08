//only sidebar side bar
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  MapPin,
  Plus,
  Link,
  Eye,
  Download,
  Upload,
  Navigation,
  RotateCcw,
  Search,
  EyeOff,
} from 'lucide-react';

export function FloorPlanSidebar() {
  //all paths, waypoints, rooms are default set to false which means that they are not initially seen
  const [showPaths, setShowPaths] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [showRooms, setShowRooms] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with actual data
  const pathCount = 0;
  const waypointCount = 0;
  const roomCount = 0;
  //below is just syling of sidebar
  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-6 border-b border-border/50">
        <h2 className="text-2xl font-bold bg-gradient-patriotic bg-clip-text text-transparent">
          Floor Plan Editor
        </h2>
      </SidebarHeader>

      <SidebarContent className="px-4">
        {/* Floor Plan Tools */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  variant="outline" 
                  className="justify-start h-12 border-border/50 hover:bg-primary/5"
                >
                  <MapPin className="h-5 w-5" />
                  <span>Waypoints</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  variant="outline" 
                  className="justify-start h-12 border-border/50 hover:bg-primary/5"
                >
                  <Plus className="h-5 w-5" />
                  <span>Rooms</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  variant="outline" 
                  className="justify-start h-12 border-border/50 hover:bg-primary/5"
                >
                  <Link className="h-5 w-5" />
                  <span>Paths</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  variant={showPaths ? "default" : "outline"}
                  className="justify-start h-12"
                  onClick={() => setShowPaths(!showPaths)} //when show paths is clicked, it will show the possible path
                >
                  <Eye className="h-5 w-5" />
                  <span>Show Paths</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        {/* Save/Load Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold text-foreground">
            Save/Load
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  variant="outline" 
                  className="justify-start h-12 border-border/50 hover:bg-primary/5"
                >
                  <Download className="h-5 w-5" />
                  <span>Export</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  variant="outline" 
                  className="justify-start h-12 border-border/50 hover:bg-primary/5"
                >
                  <Upload className="h-5 w-5" />
                  <span>Import</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        {/* Navigation Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold text-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  variant="default"
                  className="justify-start h-12 bg-gradient-patriotic text-white hover:opacity-90"
                >
                  <Navigation className="h-5 w-5" />
                  <span>Route</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  variant="outline" 
                  className="justify-start h-12 border-border/50 hover:bg-accent/5"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span>Clear</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        {/* Paths Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span className="text-lg font-semibold text-foreground">
              Paths ({pathCount})
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 py-3 text-sm text-muted-foreground rounded-lg bg-muted/30">
              No paths created. Use Path mode to connect waypoints and rooms.
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        {/* Waypoints Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span className="text-lg font-semibold text-foreground">
              Waypoints ({waypointCount})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWaypoints(!showWaypoints)} // show/hide waypoint button 
              className="h-8 w-8 p-0"
            >
              {showWaypoints ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {waypointCount === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground rounded-lg bg-muted/30">
                No waypoints created.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Waypoint list would go here */}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        {/* Rooms Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span className="text-lg font-semibold text-foreground">
              Rooms ({roomCount})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRooms(!showRooms)} // this is the show rooms/don't show rooms button
              className="h-8 w-8 p-0"
            >
              {showRooms ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}// basically means that if the user stars writing '1' for room number 101, the search query will offer a lot of options with the character 1 in it. 
                className="pl-10 h-10 border-border/50"
              />
            </div>
            {roomCount === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground rounded-lg bg-muted/30">
                No rooms created.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Room list would go here */}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
