import { createRoot } from "react-dom/client";
import { RouterProvider, ScrollRestoration } from "@tanstack/react-router";
import { getRouter } from "./router";

const router = getRouter();

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ScrollRestoration />
    </>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(<App />);
