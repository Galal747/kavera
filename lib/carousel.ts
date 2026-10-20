// يلف الرقم جوه نطاق الشرايح (بعد آخر شريحة نرجع للأولى، وقبل الأولى نروح للآخرة)
export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export type SwipeDirection = "next" | "prev" | null;

// سحب لليسار = الشريحة اللي بعدها، لليمين = اللي قبلها.
// السحب القصير أو العمودي (الصفحة بتتحرك لتحت) بيتتجاهل.
export function getSwipeDirection(
  deltaX: number,
  deltaY: number,
  threshold = 50,
): SwipeDirection {
  if (Math.abs(deltaX) < threshold) return null;
  if (Math.abs(deltaY) > Math.abs(deltaX)) return null;
  return deltaX < 0 ? "next" : "prev";
}