// import { useState } from 'react';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Switch } from '@/components/ui/switch';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
// import { ChevronDown, MapPin, Wifi, Satellite, Settings, History } from 'lucide-react';
// import { useHybridPositioning } from '@/hooks/useHybridPositioning';

// export function PositioningStatus() {
//   const {
//     currentPosition,
//     isScanning,
//     config,
//     positionHistory,
//     scanPosition,
//     getSmoothedPosition,
//     updateConfig,
//     clearHistory
//   } = useHybridPositioning();

//   const [showSettings, setShowSettings] = useState(false);
//   const [showHistory, setShowHistory] = useState(false);

//   const getMethodIcon = (method: string) => {
//     switch (method) {
//       case 'wifi': return <Wifi className="h-4 w-4" />;
//       case 'gps': return <Satellite className="h-4 w-4" />;
//       case 'hybrid': return <MapPin className="h-4 w-4" />;
//       default: return <MapPin className="h-4 w-4" />;
//     }
//   };

//   const getMethodColor = (method: string) => {
//     switch (method) {
//       case 'wifi': return 'bg-primary';
//       case 'gps': return 'bg-accent';
//       case 'hybrid': return 'bg-gradient-patriotic';
//       default: return 'bg-muted';
//     }
//   };

//   const formatAccuracy = (accuracy: number) => {
//     return `${Math.round(accuracy * 100)}%`;
//   };

//   const smoothedPosition = getSmoothedPosition();

//   return (
//     <div className="flex items-center gap-4 w-full">
//       {/* Current Position Status - Compact */}
//       <div className="flex items-center gap-4 flex-1">
//         <div className="flex items-center gap-2">
//           <span className="text-sm font-medium text-foreground">Position:</span>
//           {currentPosition ? (
//             <Badge 
//               variant="secondary" 
//               className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary border-primary/20"
//             >
//               {getMethodIcon(currentPosition.method)}
//               {currentPosition.method.toUpperCase()}
//             </Badge>
//           ) : (
//             <Badge variant="outline" className="border-accent/50 text-accent">No Signal</Badge>
//           )}
//         </div>

//         {currentPosition && (
//           <>
//             <div className="flex items-center gap-2">
//               <span className="text-sm text-muted-foreground">Accuracy:</span>
//               <Badge variant="outline" className="text-xs">
//                 {formatAccuracy(currentPosition.accuracy)}
//               </Badge>
//             </div>

//             <div className="flex items-center gap-2">
//               <span className="text-sm text-muted-foreground">Coords:</span>
//               <span className="text-xs font-mono">
//                 {currentPosition.coordinates[0].toFixed(1)}, {currentPosition.coordinates[1].toFixed(1)}
//               </span>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Action Buttons */}
//       <div className="flex items-center gap-2">
//         <Button 
//           onClick={scanPosition} 
//           disabled={isScanning}
//           variant="outline"
//           size="sm"
//           className="h-8 px-3"
//         >
//           {isScanning ? (
//             <>
//               <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
//               Scanning
//             </>
//           ) : (
//             <>
//               <MapPin className="h-3 w-3 mr-1" />
//               Scan
//             </>
//           )}
//         </Button>
        
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => setShowSettings(!showSettings)}
//           className="h-8 w-8 p-0"
//         >
//           <Settings className="h-3 w-3" />
//         </Button>
        
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => setShowHistory(!showHistory)}
//           className="h-8 w-8 p-0"
//         >
//           <History className="h-3 w-3" />
//         </Button>
//       </div>
//     </div>
//   );
// }
