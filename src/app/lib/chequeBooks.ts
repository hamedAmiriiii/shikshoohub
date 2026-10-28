export type ChequeBookLeaf = {
  id: number;
  cheque_book_id?: number;
  leaf_number: number;
  leaf_number_label?: string;
  status?: string;
  status_label?: string;
  cheque_id?: number | null;
};

export type ChequeBook = {
  id: number;
  title?: string | null;
  display_title?: string | null;
  bank_name?: string | null;
  shop_account_id?: number | null;
  start_number: number;
  end_number: number;
  leaf_count: number;
  unused_count?: number;
  used_count?: number;
  unused_leaves_count?: number;
  used_leaves_count?: number;
  note?: string | null;
  unused_leaves?: ChequeBookLeaf[];
  leaves?: ChequeBookLeaf[];
};

export function chequeBookLabel(book: ChequeBook): string {
  const title = String(book.display_title || book.title || "").trim();
  if (title) return title;
  const bank = String(book.bank_name || "").trim();
  const range = `${book.start_number} تا ${book.end_number}`;
  return bank ? `${bank} · ${range}` : `دسته چک ${range}`;
}

export function chequeBookUnusedCount(book: ChequeBook): number {
  const n = Number(book.unused_count ?? book.unused_leaves_count);
  return Number.isFinite(n) ? n : 0;
}
