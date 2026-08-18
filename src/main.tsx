// 배포 트리거 2026-08-19
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { stashPendingSurvey } from "./lib/pendingSurvey";

// 구간H: 라우팅(ProtectedRoute)보다 먼저, URL 의 surveyId 를 스태시해 인증 왕복에서 생존시킴
stashPendingSurvey(new URLSearchParams(window.location.search).get("surveyId"));

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);