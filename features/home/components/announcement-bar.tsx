import type { CSSProperties } from "react";

type AnnouncementBarProps = {
  messages: readonly string[];
  /** مدة لفّة كاملة بالثواني. زوّدها لو زوّدت نصوص كتير (أبطأ). */
  durationSeconds?: number;
};

export function AnnouncementBar({
  messages,
  durationSeconds = 30,
}: AnnouncementBarProps) {
  if (messages.length === 0) return null;

  // مجموعتين متطابقتين جنب بعض، والحركة بتزحزح الاتنين بنص عرضهم (= عرض مجموعة واحدة).
  // كل مجموعة عرضها على الأقل عرض الشاشة، فمفيش فراغ على أي حجم.
  // الثانية aria-hidden عشان قارئ الشاشة ما يقراش النص مرتين.
  const group = (hidden: boolean) => (
    <ul
      className="marquee-group flex min-w-[100vw] shrink-0 items-center justify-around"
      aria-hidden={hidden || undefined}
    >
      {messages.map((message, i) => (
        <li
          key={i}
          className="flex shrink-0 items-center gap-12 whitespace-nowrap px-6"
        >
          <span>{message}</span>
          <span aria-hidden="true">•</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      role="region"
      aria-label="Announcements"
      className="overflow-hidden bg-neutral-200 py-3 text-xs uppercase tracking-widest text-neutral-800"
    >
      <div
        className="marquee-track flex w-max"
        style={{ "--marquee-duration": `${durationSeconds}s` } as CSSProperties}
      >
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}