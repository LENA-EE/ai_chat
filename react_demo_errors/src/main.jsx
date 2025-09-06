import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import ErrorBoundary from "./ErrorBoundary";

import PaymentForm from "./PaymentForm.jsx";
import AIChat from "./AIChat";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <AIChat />
    {/* <PaymentForm /> */}
  </ErrorBoundary>
);
