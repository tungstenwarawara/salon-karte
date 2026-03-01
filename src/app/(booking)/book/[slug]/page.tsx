import { BookingPageClient } from "@/components/booking/booking-page-client";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return {
    title: `Web予約 - ${slug}`,
    description: "オンライン予約ページです。",
    robots: { index: false, follow: false },
  };
}

export default async function BookingPage({ params }: Props) {
  const { slug } = await params;
  return <BookingPageClient slug={slug} />;
}
