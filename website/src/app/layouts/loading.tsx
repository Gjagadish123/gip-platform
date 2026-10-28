import { LayoutsSkeleton } from "@/components/layouts/experience";

// While the page's data loads (a cold cache waits on the database), the same frame as the page, with quiet shapes.
export default function Loading() {
  return <LayoutsSkeleton />;
}
