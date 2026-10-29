import { Suspense } from "react";
import MeClient from "./MeClient";

export default function MePage() {
  return (
    <Suspense fallback={<p>در حال بارگذاری...</p>}>
      <MeClient />
    </Suspense>
  );
}
