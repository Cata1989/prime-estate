import ChatRoom from '@/components/ChatRoom';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';

export default async function ChatPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <div className="p-6">Neautorizat</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Conversație</h1>
      <ChatRoom conversationId={params.conversationId} />
    </div>
  );
}