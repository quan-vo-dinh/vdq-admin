import { withOwner } from "@/lib/auth/api";
import { NextResponse } from 'next/server'
import { posts } from '../userdata'
import { Reply } from '@/app/(dashboard-layout)/types/apps/userprofile'

async function handlePOST(req: Request) {
  try {
    const { postId, commentId, reply } = (await req.json()) as {
      postId: string
      commentId: string
      reply: Reply
    }
    const postIndex = posts.findIndex((x) => x.id === postId)
    const post = posts[postIndex]
    const cComments = post.data.comments || []
    const commentIndex = cComments.findIndex((x) => x.id === commentId)
    const comment = cComments[commentIndex]
    if (comment && comment.data && comment.data.replies)
      comment.data.replies = [...comment.data.replies, reply]
    return NextResponse.json({ status: 200, msg: 'Success', data: posts })
  } catch (error: unknown) {
    return NextResponse.json({
      status: 200,
      msg: 'Internal server error',
      error,
    })
  }
}

export const POST = withOwner(handlePOST);
