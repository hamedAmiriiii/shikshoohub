/** حساب oil که از لاگین فروشگاه آمده — باید به /oil برود */
export function isOilProjectLoginMessage(message: string | null | undefined): boolean {
  return /\/oil|تعویض روغن/.test(String(message || ""));
}
