import { createRoot, type Root } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

const router = getRouter();

export function App() {
  return <RouterProvider router={router} />;
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

type RootContainer = HTMLElement & { __autemReactRoot?: Root };

// Vite can re-evaluate the client entry during development. Reuse the mounted
// React root so HMR does not attempt to create a second root on #root.
const rootContainer = rootElement as RootContainer;
const root = rootContainer.__autemReactRoot ?? createRoot(rootContainer);
rootContainer.__autemReactRoot = root;

root.render(<App />);
