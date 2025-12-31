# Three.js Spaceship Simulation

A sophisticated 3D spaceship environment built with Three.js, featuring interactive 3D models and shader effects.

## 🎥 Demo

https://github.com/user-attachments/assets/Screencast%20from%202025-12-31%2013-09-39.webm

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` (or the port shown in terminal).

### Docker Build

To build and run using Docker:

```bash
# Build the image
docker build -t threejs-spaceship .

# Run the container
docker run -p 8080:80 threejs-spaceship
```

Visit `http://localhost:8080`.

## 📂 Project Structure

The core logic is contained in `src/scene.js` and its helper modules.

### Core Files

| File                         | Description                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/scene.js`               | **Main Entry Point**. Sets up the spaceship scene, camera, lighting, and manages the render loop. Handles raycasting for interaction. |
| `src/createTiledFloor.js`    | Generates the reflective tiled floor geometry and grid.                                                                               |
| `src/createDragonModel.js`   | Handles loading GLB models (like the dragon/mech) and managing their animations.                                                      |
| `src/moveFloorModels.js`     | Logic for autonomous movement of models on the floor. **Models follow the mouse cursor.**                                             |
| `src/morphModelsToPoints.js` | Advanced effect that morphs 3D meshes into interactive point clouds.                                                                  |
| `src/rippleWalls.js`         | Custom shader material for walls that creates ripple effects on interaction.                                                          |

### Unused / Legacy Files

The following files are present in the source but are **not** used by the current `scene.js` application and can be ignored or removed:

- `src/main.js` (Old fractal entry point)
- `src/fractal.frag`
- `src/fullscreen.vert`
- `src/lines.js`
- `src/svg.js`
- `src/glowOutline.js`

## 🎮 Controls & Interaction

- **Mouse Move**:
  - The **Dragon/Mech follows your cursor** on the floor.
  - Interact with the ripple walls.
- **Click & Drag**: Rotate the currently selected 3D model.

## 💡 Implementation Notes

- **Point Cloud Transformation**: The models are sampled into point geometry **after 60 seconds**. If I had more time, I would have animated the transition of how the models turn into points and added more logic to it. Due to time limits, I stopped at the stage of turning them into points.
- **Concept Reusability**: The logic implemented in this scene—such as the ripple effect, mouse interactions, and point sampling—can be utilized in different ways to develop different concepts.

## 🛠 Tech Stack

- **Three.js**: 3D Rendering engine.
- **Vite**: Build tool and dev server.
- **GLSL**: Custom shaders for ripples and particles.
- **Docker**: Containerization for deployment.
