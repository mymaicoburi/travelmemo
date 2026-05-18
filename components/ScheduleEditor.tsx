"use client";

import { useState, useTransition } from "react";
import type { ScheduleItem, Comment } from "@/lib/types";
import {
  addScheduleItem,
  deleteScheduleItem,
  updateScheduleItem,
} from "@/app/trip/[slug]/actions";
import { formatDateJa, formatTime } from "@/lib/date";
import CommentSection from "./CommentSection";
import LocationMap from "./LocationMap";

type Props = {
  slug: string;
  days: string[];
  items: ScheduleItem[];
  comments: Comment[];
};

export default function ScheduleEditor({
  slug,
  days,
  items,
  comments,
}: Props) {
  const grouped = groupByDay(items, days);

  return (
    <section className="mt-6">
      <h2 className="mb-3 text-base font-semibold text-gray-800">日程</h2>
      <div className="space-y-4">
        {grouped.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            まだ日程がありません。<br />
            下のフォームから追加するか、上の「編集」から日付を設定してください。
          </p>
        )}
        {grouped.map(({ day, dayItems }) => (
          <DaySection
            key={day}
            slug={slug}
            day={day}
            items={dayItems}
            comments={comments}
          />
        ))}
      </div>

      <AddItemForm slug={slug} defaultDay={days[0] ?? ""} />
    </section>
  );
}

function groupByDay(items: ScheduleItem[], days: string[]) {
  const map = new Map<string, ScheduleItem[]>();
  for (const day of days) map.set(day, []);
  for (const item of items) {
    if (!map.has(item.day)) map.set(item.day, []);
    map.get(item.day)!.push(item);
  }
  const keys = Array.from(map.keys()).sort();
  return keys.map((day) => ({ day, dayItems: map.get(day) ?? [] }));
}

function DaySection({
  slug,
  day,
  items,
  comments,
}: {
  slug: string;
  day: string;
  items: ScheduleItem[];
  comments: Comment[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
        {formatDateJa(day)}
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-400">
          予定がありません
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <ScheduleRow
              key={item.id}
              slug={slug}
              item={item}
              itemComments={comments.filter(
                (c) => c.schedule_item_id === item.id
              )}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ScheduleRow({
  slug,
  item,
  itemComments,
}: {
  slug: string;
  item: ScheduleItem;
  itemComments: Comment[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    if (!confirm(`「${item.title}」を削除しますか？`)) return;
    startTransition(async () => {
      try {
        await deleteScheduleItem(slug, item.id);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  const onSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateScheduleItem(slug, item.id, fd);
        setEditing(false);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  if (editing) {
    return (
      <li className="p-4">
        <ItemFields onSubmit={onSave} item={item} pending={pending}>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            キャンセル
          </button>
        </ItemFields>
      </li>
    );
  }

  return (
    <li className="px-4 py-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 text-left"
      >
        <span className="w-12 shrink-0 pt-0.5 text-sm text-gray-500">
          {formatTime(item.start_time) || "--:--"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-gray-900">{item.title}</span>
          {item.location && (
            <span className="mt-0.5 block text-xs text-gray-500">
              📍 {item.location}
            </span>
          )}
        </span>
        {itemComments.length > 0 && (
          <span className="ml-2 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            💬 {itemComments.length}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          {item.location && <LocationMap location={item.location} />}
          {item.memo && (
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {item.memo}
            </p>
          )}
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50"
            >
              編集
            </button>
            <button
              onClick={onDelete}
              disabled={pending}
              className="rounded-md border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              削除
            </button>
          </div>
          <CommentSection
            slug={slug}
            scheduleItemId={item.id}
            comments={itemComments}
            compact
          />
        </div>
      )}
    </li>
  );
}

function AddItemForm({
  slug,
  defaultDay,
}: {
  slug: string;
  defaultDay: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-2xl border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:border-brand hover:text-brand"
      >
        ＋ 予定を追加
      </button>
    );
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await addScheduleItem(slug, fd);
        (e.target as HTMLFormElement).reset();
        setOpen(false);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">予定を追加</h3>
      <ItemFields
        onSubmit={onSubmit}
        item={{
          day: defaultDay,
          start_time: "",
          title: "",
          location: "",
          memo: "",
        }}
        pending={pending}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          キャンセル
        </button>
      </ItemFields>
    </div>
  );
}

type ItemFieldsData = {
  day: string;
  start_time: string | null;
  title: string;
  location: string | null;
  memo: string | null;
};

function ItemFields({
  onSubmit,
  item,
  pending,
  children,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  item: ItemFieldsData;
  pending: boolean;
  children?: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          name="day"
          defaultValue={item.day}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="time"
          name="start_time"
          defaultValue={item.start_time ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <input
        name="title"
        defaultValue={item.title}
        required
        placeholder="予定のタイトル"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        name="location"
        defaultValue={item.location ?? ""}
        placeholder="場所 (任意)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <textarea
        name="memo"
        defaultValue={item.memo ?? ""}
        rows={2}
        placeholder="メモ (任意)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
        >
          {pending ? "保存中…" : "保存"}
        </button>
        {children}
      </div>
    </form>
  );
}
