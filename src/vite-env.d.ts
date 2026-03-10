/// <reference types="vite/client" />

// Provide NodeJS.Timeout type for setTimeout/setInterval refs
declare namespace NodeJS {
  type Timeout = ReturnType<typeof setTimeout>;
}
