'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export function RealtimeNotification() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // 초기 미확인 문의 개수 가져오기
    fetchUnreadCount()

    // 실시간 구독 설정
    const channel = supabase
      .channel('inquiries_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inquiries',
        },
        (payload) => {
          setUnreadCount((prev) => prev + 1)
          toast.info('새로운 문의가 접수되었습니다!', {
            description: payload.new.email || '확인해주세요',
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchUnreadCount() {
    const { count } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    setUnreadCount(count || 0)
  }

  return (
    <div className="relative">
      <Bell className="w-5 h-5 text-zinc-400" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </div>
  )
}
