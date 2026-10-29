import { Suspense } from "react";

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p>در حال بارگذاری...</p>}>{children}</Suspense>;
}
