import type { NotesType } from '@/app/(dashboard-layout)/types/apps/notes';
import { parseNoteUpdate, plainDocument } from '@/lib/notes/model';
import { NextResponse } from 'next/server';

const seeds = [
  { title: 'Nhật ký làm việc', text: 'Mục tiêu hôm nay\nHoàn thiện dashboard và ghi lại những quyết định đáng nhớ.', color: 'primary', datef: '2026-10-20T08:30:00+07:00' },
  { title: 'Ý tưởng cho phiên code tiếp theo', text: 'Tách công việc lớn thành các bước nhỏ.\nĐể lại thời gian kiểm tra giao diện trên điện thoại.', color: 'chart-2', datef: '2026-10-20T14:00:00+07:00' },
  { title: 'Ghi chú buổi họp', text: 'Các điểm cần làm rõ\nPhạm vi, mốc bàn giao và người phụ trách.', color: 'chart-4', datef: '2026-10-19T15:15:00+07:00' },
  { title: 'Cuối tuần nạp lại pin', text: 'Đọc một chương sách, đi bộ và đóng bớt tab trong đầu.', color: 'chart-3', datef: '2026-10-18T09:00:00+07:00' },
];
let notes: NotesType[] = seeds.map((note, index) => ({ ...note, id: index + 1, deleted: false, content: plainDocument(note.text), createdAt: new Date(note.datef).toISOString(), updatedAt: new Date(note.datef).toISOString() }));
let nextId = 5;
const response = () => NextResponse.json({ status: 200, msg: 'Success', data: notes });
const failure = (error: unknown) => NextResponse.json({ msg: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 });

export async function GET() { return response(); }
export async function POST(req: Request) {
  try {
    const update = parseNoteUpdate(await req.json());
    if (!update.title) throw new Error('Title is required');
    const now = new Date().toISOString();
    notes = [...notes, { ...update, id: nextId++, deleted: false, content: update.content ?? plainDocument(), datef: update.datef ?? now, createdAt: now, updatedAt: now }];
    return response();
  } catch (error) { return failure(error); }
}
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const index = notes.findIndex(note => note.id === body.id);
    if (index === -1) return NextResponse.json({ msg: 'Note not found' }, { status: 404 });
    const update = parseNoteUpdate(body);
    notes = notes.map((note, i) => i === index ? { ...note, ...update, updatedAt: new Date().toISOString() } : note);
    return response();
  } catch (error) { return failure(error); }
}
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!notes.some(note => note.id === id)) return NextResponse.json({ msg: 'Note not found' }, { status: 404 });
    notes = notes.filter(note => note.id !== id);
    return response();
  } catch (error) { return failure(error); }
}
