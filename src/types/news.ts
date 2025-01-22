export interface FeaturedPost {
  id: number
  title: string
  category: string
  date: string
  readTime: string
  excerpt: string
  content: string
  image: string
  trending?: boolean
  isRead?: boolean
  tags?: string[]
} 