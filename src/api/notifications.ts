import { NextResponse } from 'next/server';

// Хранилище уведомлений в памяти (для демонстрации)
// В реальном проекте используйте базу данных
let notifications: any[] = [
  {
    id: '1',
    title: 'Новый студент зачислен',
    description: 'В группу ИС-21 добавлен новый студент',
    time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    read: false,
    type: 'student_added',
    data: { groupId: '1', studentName: 'Иванов Иван' }
  },
  {
    id: '2',
    title: 'Обновление расписания',
    description: 'Изменения в расписании группы ИС-22',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    type: 'schedule_update',
    data: { groupId: '2' }
  }
];

// GET - получить все уведомления
export async function GET() {
  return NextResponse.json(notifications);
}

// POST - создать новое уведомление
export async function POST(request: Request) {
  const body = await request.json();
  
  const newNotification = {
    id: Date.now().toString(),
    ...body,
    time: new Date().toISOString(),
    read: false
  };
  
  notifications.unshift(newNotification);
  
  // Ограничиваем количество уведомлений (храним последние 100)
  if (notifications.length > 100) {
    notifications = notifications.slice(0, 100);
  }
  
  return NextResponse.json(newNotification, { status: 201 });
}

// PATCH - отметить уведомление как прочитанное
export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID не указан' }, { status: 400 });
  }
  
  const notification = notifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
  }
  
  return NextResponse.json(notification);
}

// DELETE - удалить уведомление
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID не указан' }, { status: 400 });
  }
  
  notifications = notifications.filter(n => n.id !== id);
  
  return NextResponse.json({ success: true });
}