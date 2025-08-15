// import {
//   Sidebar,
//   SidebarContent,
//   SidebarHeader,
//   SidebarTrigger,
//   useSidebar,
// } from "@/components/ui/sidebar";
// import { PositioningStatus } from "@/components/PositioningStatus";
// import { Navigation } from "lucide-react";

// export function PositioningSidebar() {
//   const { state } = useSidebar();
//   const isCollapsed = state === "collapsed";

//   return (
//     <Sidebar className={isCollapsed ? "w-14" : "w-80"}>
//       <SidebarHeader className="p-4 border-b border-border">
//         <div className="flex items-center gap-2">
//           <Navigation className="h-5 w-5 text-primary" />
//           {!isCollapsed && (
//             <h2 className="font-semibold text-foreground">Positioning</h2>
//           )}
//         </div>
//         <SidebarTrigger className="ml-auto" />
//       </SidebarHeader>
      
//       <SidebarContent className="p-0">
//         {!isCollapsed && <PositioningStatus />}
//       </SidebarContent>
//     </Sidebar>
//   );
// }
