"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  ScheduleItem,
  Comment,
  TripMember,
  ScheduleParticipant,
  Attachment,
} from "@/lib/types";
import {
  addScheduleItem,
  deleteScheduleItem,
  updateScheduleItem,
} from "@/app/trip/[slug]/actions";
import { formatDateJa, formatEnd, formatTime } from "@/lib/date";
import CommentSection from "./CommentSection";
import LocationMap from "./LocationMap";
import AttachmentGallery from "./AttachmentGallery";

type Props = {
  slug: string;
  days: string[];
  items: ScheduleItem[];
  comments: Comment[];
  members: TripMember[];
  participants: ScheduleParticipant[];
  attachments: Attachment[];
  currentAuthorName: string;
};

export default function ScheduleEditor({
  slug,
  days,
  items,
  comments,
  members,
  participants,
  attachments,
  currentAuthorName,
}: Props) {
  const grouped = groupByDay(items, days);

  const participantMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const p of participants) {
      if (!m.has(p.schedule_item_id)) m.set(p.schedule_item_id, new Set());
      m.get(p.schedule_item_id)!.add(p.member_id);
    }
    return m;
  }, [participants]);

  const attachmentMap = useMemo(() => {
    const m = new Map<string, Attachment[]>();
    for (const a of attachments) {
      if (!m.has(a.schedule_item_id)) m.set(a.schedule_item_id, []);
      m.get(a.schedule_item_id)!.push(a);
    }
    return m;
  }, [attachments]);

  const currentMemberId = useMemo(
    () => members.find((m) => m.name === currentAuthorName)?.id ?? null,
    [members, currentAuthorName]
  );

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
            members={members}
            participantMap={participantMap}
            attachmentMap={attachmentMap}
          />
        ))}
      </div>

      <AddItemForm
        slug={slug}
        defaultDay={days[0] ?? ""}
        members={members}
        defaultSelectedMemberId={currentMemberId}
      />
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
  members,
  participantMap,
  attachmentMap,
}: {
  slug: string;
  day: string;
  items: ScheduleItem[];
  comments: Comment[];
  members: TripMember[];
  participantMap: Map<string, Set<string>>;
  attachmentMap: Map<string, Attachment[]>;
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
              members={members}
              selectedMemberIds={participantMap.get(item.id) ?? new Set()}
              itemAttachments={attachmentMap.get(item.id) ?? []}
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
  members,
  selectedMemberIds,
  itemAttachments,
}: {
  slug: string;
  item: ScheduleItem;
  itemComments: Comment[];
  members: TripMember[];
  selectedMemberIds: Set<string>;
  itemAttachments: Attachment[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const participantMembers = members.filter((m) =>
    selectedMemberIds.has(m.id)
  );

  const endText = formatEnd(item.day, item.end_date, item.end_time);

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
        <ItemFields
          onSubmit={onSave}
          item={item}
          members={members}
          selectedMemberIds={selectedMemberIds}
          pending={pending}
        >
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
          <span className="block font-medium text-gray-900">
            {item.title}
            {endText && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                {endText}
              </span>
            )}
          </span>
          {item.location && (
            <span className="mt-0.5 block text-xs text-gray-500">
              📍 {item.location}
            </span>
          )}
          {participantMembers.length > 0 && (
            <span className="mt-1 flex flex-wrap gap-1">
              {participantMembers.map((m) => (
                <span
                  key={m.id}
                  className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] text-brand"
                >
                  {m.name}
                </span>
              ))}
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
          <AttachmentGallery
            slug={slug}
            itemId={item.id}
            attachments={itemAttachments}
          />
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
  members,
  defaultSelectedMemberId,
}: {
  slug: string;
  defaultDay: string;
  members: TripMember[];
  defaultSelectedMemberId: string | null;
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

  const defaultSelected = new Set<string>();
  if (defaultSelectedMemberId) defaultSelected.add(defaultSelectedMemberId);

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
          end_date: "",
          end_time: "",
          title: "",
          location: "",
          memo: "",
        }}
        members={members}
        selectedMemberIds={defaultSelected}
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
  end_date: string | null;
  end_time: string | null;
  title: string;
  location: string | null;
  memo: string | null;
};

function ItemFields({
  onSubmit,
  item,
  members,
  selectedMemberIds,
  pending,
  children,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  item: ItemFieldsData;
  members: TripMember[];
  selectedMemberIds: Set<string>;
  pending: boolean;
  children?: React.ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(selectedMemberIds)
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div>
        <p className="mb-1 text-xs text-gray-500">開始</p>
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
      </div>
      <div>
        <p className="mb-1 text-xs text-gray-500">
          終了 (任意 — 日付は宿泊など日が変わる場合のみ)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            name="end_date"
            defaultValue={item.end_date ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="time"
            name="end_time"
            defaultValue={item.end_time ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
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

      {members.length > 0 && (
        <div className="pt-1">
          <p className="mb-1.5 text-xs text-gray-500">参加メンバー</p>
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => {
              const on = selected.has(m.id);
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => toggle(m.id)}
                  className={
                    "rounded-full px-3 py-1 text-xs transition-colors " +
                    (on
                      ? "bg-brand text-white"
                      : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50")
                  }
                >
                  {on ? "✓ " : ""}
                  {m.name}
                </button>
              );
            })}
          </div>
          {Array.from(selected).map((id) => (
            <input key={id} type="hidden" name="member_ids" value={id} />
          ))}
        </div>
      )}

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
