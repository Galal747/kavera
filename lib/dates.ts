// "2026-11-30" → هل هو تاريخ حقيقي؟ (بيرفض 2026-02-31 مثلًا)
export function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function cairoOffset(at: Date): string {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    timeZoneName: "longOffset",
  })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  return part?.match(/GMT([+-]\d{2}:\d{2})/)?.[1] ?? "+02:00";
}

// بداية اليوم (00:00:00) أو نهايته (23:59:59) بتوقيت القاهرة، كـ ISO string
export function cairoDateToIso(date: string, endOfDay: boolean): string {
  const time = endOfDay ? "23:59:59" : "00:00:00";
  // بنحدد الفرق من منتصف اليوم، بعيد عن لحظة تغيير التوقيت الصيفي
  const offset = cairoOffset(new Date(`${date}T12:00:00Z`));
  return new Date(`${date}T${time}${offset}`).toISOString();
}