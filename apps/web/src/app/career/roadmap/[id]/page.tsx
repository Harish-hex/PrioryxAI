"use client";

import { RoadmapDetailView } from "../shared";

export default function RoadmapDetailPage({ params }: { params: { id: string } }) {
  return <RoadmapDetailView roadmapId={params.id} />;
}
