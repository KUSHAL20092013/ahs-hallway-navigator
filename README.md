# Welcome to The AHS Navigator
## Project info

**URL**: 
## How can I edit this code?

There are several ways of editing this application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. 

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Building Process


## Key Features
### Core Navigation Features
- Room Search: Search and select any room in the school from a comprehensive database
- Route Calculation: Calculate optimal paths between any two rooms
- Current Location: Use your device's location as a starting point for navigation
- Visual Map Interface: Interactive floor plan with clickable room locations
- Positioning & Location Services
- Mobile-First Design: Optimized for smartphones and tablets
- Responsive Layout: Works seamlessly across different screen sizes
- Offline Capable: Core functionality works without internet connection

## Main Files + Description
1. ImageMap.tsx - This is where yhr majority of the logic happens. We initialize everything on the map such as the waypoints, rooms, paths, and the image itself. This includes adding the x and y coordinates to the json file called navigationData.json. Constructing the path also happens here. Current location code is here too so it asks user for permission, then maps the geolocation coordinates to the image pixel coordinates to create a box area of coordinates. by comparing the scale value of the image coordinates and the geopositioning coordinates, the function estimates how far the user has to walk.
   
2. SearchNavigation.tsx - This is the class which filters rooms based on what the user first types. It also includes the initial current location option which users see when they first load the app.

## How to Build a similar app for your own institution
1. Create a similar UI with a taskbar on the side with a mode to put dots where you touch with the name of rooms and another mode to put dots where you touch called waypoints. Make sure you export these coordinates into a JSON file which you will import later.
2. Make the points in stratigic locations, minimizing the amount of waypoints so that the algorithm will work efficiently.
3. Import the rooms and waypoints json file but remember to hide the waypoints so that your map will not feel messy.
4. Create a Path mode to connect all waypoints without going through walls. You usually do this by tapping on the two waypoints you want to connect and there will be a straight line formed between them. 
