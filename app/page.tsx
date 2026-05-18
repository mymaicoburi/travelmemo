import Link from "next/link";
import { createTrip } from "./actions";
import RecentTrips from "@/components/RecentTrips";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-brand">TravelMemo</h1>
        <p className="mt-2 text-sm text-gray-600">
          家族と旅行の日程をかんたんに共有
        </p>
      </header>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">新しい旅行をつくる</h2>
        <form action={createTrip} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              タイトル
              <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              placeholder="例: 沖縄家族旅行"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              行き先 (任意)
            </label>
            <input
              name="destination"
              placeholder="例: 沖縄県"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                開始日
              </label>
              <input
                type="date"
                name="start_date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                終了日
              </label>
              <input
                type="date"
                name="end_date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-brand-light"
          >
            旅行をつくる
          </button>
        </form>
        <p className="mt-3 text-xs text-gray-500">
          作成後、専用 URL が発行されます。その URL を家族と共有してください。
        </p>
      </section>

      <RecentTrips />

      <footer className="mt-10 text-center text-xs text-gray-400">
        <Link href="/" className="hover:underline">
          TravelMemo
        </Link>
      </footer>
    </main>
  );
}
