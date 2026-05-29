"use client";
import { useParams } from "next/navigation";
import { EventDetail } from "@/components/events/EventDetail";

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  return <EventDetail id={id} />;
}
