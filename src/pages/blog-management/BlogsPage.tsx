import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  PlusCircle,
  Search,
  Eye,
  Calendar,
  MessageSquareWarning,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  HelpCircle,
  Trash2,
  Loader2,
} from 'lucide-react'
import api from '@/services/api'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { CATEGORY_MAP } from './AddBlogPage'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const getTagBadgeStyle = (tag: string) => {
  const cat = CATEGORY_MAP[tag] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' }
  return `${cat.bg} ${cat.text} ${cat.border} border`
}

interface BlogItem {
  _id: string
  title: string
  slug: string
  summary?: string
  coverImage: string
  tag: string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED'
  views: number
  rejectionReason?: string | null
  createdAt: string
}

interface PaginationInfo {
  totalItems: number
  totalPages: number
  currentPage: number
  limit: number
}

function BlogsPage() {
  const navigate = useNavigate()
  
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const [blogs, setBlogs] = useState<BlogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    (localStorage.getItem('blogViewMode') as 'grid' | 'list') || 'grid'
  )

  const handleDeleteBlog = async () => {
    if (!blogToDelete) return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await api.delete(`/partner/blogs/${blogToDelete}`)
      if (res.data?.success) {
        setBlogToDelete(null)
        fetchBlogs()
      } else {
        setDeleteError('Failed to delete blog post.')
      }
    } catch (err: any) {
      console.error('Error deleting blog:', err)
      setDeleteError(err.response?.data?.message || 'Error deleting blog post. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('blogViewMode', mode)
  }

  const fetchBlogs = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('page', page.toString())
      queryParams.append('limit', '6')
      
      if (search.trim()) {
        queryParams.append('search', search.trim())
      }
      if (statusFilter !== 'ALL') {
        queryParams.append('status', statusFilter)
      }

      const res = await api.get(`/partner/blogs?${queryParams.toString()}`)
      if (res.data?.success) {
        setBlogs(res.data.blogs || [])
        setPagination(res.data.pagination || null)
      }
    } catch (error) {
      console.error('Error fetching partner blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch blogs when page, statusFilter changes
  useEffect(() => {
    fetchBlogs()
  }, [page, statusFilter])

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#blogs-header',
          popover: {
            title: 'Welcome to Blogs Management!',
            description: 'This is where you can write and manage all your announcements, travel guides, and articles.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#blogs-filter-search',
          popover: {
            title: 'Search & Filters',
            description: 'Easily search articles by title or summary, and filter them by status (Draft, Pending Approval, Published, Rejected).',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#blogs-view-mode',
          popover: {
            title: 'Layout Mode',
            description: 'Toggle between Grid view (3-column cards layout) and List view (compact rows layout) depending on your preferences.',
            side: 'bottom',
            align: 'end'
          }
        },
        {
          element: '#blogs-add-btn',
          popover: {
            title: 'Write a New Article',
            description: 'Click here to write and publish a new post using Markdown!',
            side: 'left',
            align: 'center'
          }
        }
      ],
      onDestroyed: () => {
        localStorage.setItem('hasSeenBlogsTour', 'true')
      }
    })
    driverObj.drive()
  }

  useEffect(() => {
    if (!loading) {
      const hasSeen = localStorage.getItem('hasSeenBlogsTour')
      if (hasSeen !== 'true') {
        const timer = setTimeout(() => {
          startTour()
        }, 800)
        return () => clearTimeout(timer)
      }
    }
  }, [loading])

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchBlogs()
  }

  const getStatusBadge = (status: BlogItem['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium">
            Published
          </Badge>
        )
      case 'PENDING_APPROVAL':
        return (
          <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-medium">
            Pending Approval
          </Badge>
        )
      case 'DRAFT':
        return (
          <Badge className="bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 font-medium">
            Draft
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-medium">
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between" id="blogs-header">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Blogs</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your articles, announcements, and travel guides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            id="blogs-tour-btn"
            className="border-slate-200 text-slate-600 hover:bg-slate-50 transition duration-200 h-10"
            onClick={startTour}
          >
            <HelpCircle size={15} className="mr-1" />
            Guide Tour
          </Button>

          <Button
            id="blogs-add-btn"
            className="bg-blue-600 text-white hover:bg-blue-700 transition duration-200 shadow-sm h-10"
            onClick={() => navigate('/blogs/add')}
          >
            <PlusCircle size={16} className="mr-1" />
            Add Blog
          </Button>
        </div>
      </div>

      {/* Filter & Search Dashboard */}
      <div id="blogs-filter-search" className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-2xs md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by title or summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          />
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <Search size={16} />
          </button>
        </form>

        <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
            {['ALL', 'PUBLISHED', 'PENDING_APPROVAL', 'DRAFT', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status)
                  setPage(1)
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  statusFilter === status
                    ? 'bg-blue-50 text-blue-600 border-blue-200 border'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                {status === 'ALL' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div id="blogs-view-mode" className="flex items-center gap-1 border-l pl-3 shrink-0">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition duration-150 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200/50 shadow-3xs'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
              title="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`p-1.5 rounded-lg transition duration-150 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200/50 shadow-3xs'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
              title="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <span className="ml-3 text-slate-500 font-medium">Loading articles...</span>
        </div>
      ) : blogs.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-20 text-center shadow-3xs">
          <Newspaper size={48} className="mx-auto mb-4 text-slate-300 animate-pulse" />
          <h3 className="text-lg font-semibold text-slate-800">No blog posts found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {search || statusFilter !== 'ALL'
              ? 'Try modifying your search query or filters to find what you are looking for.'
              : 'Start sharing your knowledge, news, or guides by creating your first article.'}
          </p>
          {(search || statusFilter !== 'ALL') ? (
            <Button
              variant="outline"
              className="mt-4 border-slate-200"
              onClick={() => {
                setSearch('')
                setStatusFilter('ALL')
                setPage(1)
              }}
            >
              Clear Filters
            </Button>
          ) : (
            <Button
              className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => navigate('/blogs/add')}
            >
              <PlusCircle size={16} className="mr-1" />
              Add Blog
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog) => (
                <div
                  key={blog._id}
                  className="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-2xs transition duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Cover Image Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    {blog.coverImage ? (
                      <img
                        src={blog.coverImage.startsWith('http') ? blog.coverImage : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${blog.coverImage}`}
                        alt={blog.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback in case of broken image link
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1546074177-ffedd79d4c4b?w=600&auto=format&fit=crop&q=60'
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Newspaper size={40} />
                      </div>
                    )}

                    {/* Tag on Image */}
                    <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs shadow-sm ${getTagBadgeStyle(blog.tag)}`}>
                      {blog.tag}
                    </span>
                  </div>

                  {/* Card Info */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex items-center justify-between">
                      {getStatusBadge(blog.status)}
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar size={12} />
                        {formatDate(blog.createdAt)}
                      </span>
                    </div>

                    <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-blue-600 transition duration-150 leading-snug">
                      {blog.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-slate-500">
                      {blog.summary || 'No summary provided.'}
                    </p>

                    {/* Rejected Reason Panel */}
                    {blog.status === 'REJECTED' && blog.rejectionReason && (
                      <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-rose-50 p-2.5 text-[11px] leading-normal text-rose-700 border border-rose-100">
                        <MessageSquareWarning size={14} className="shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Reason: </span>
                          {blog.rejectionReason}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Eye size={14} />
                        {blog.views.toLocaleString()} views
                      </span>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-slate-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          disabled={blog.status === 'PENDING_APPROVAL'}
                          title={blog.status === 'PENDING_APPROVAL' ? "Cannot edit post while pending approval" : ""}
                          onClick={() => navigate(`/blogs/${blog._id}/edit`)}
                        >
                          Edit Post
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-750 transition disabled:opacity-50"
                          disabled={blog.status === 'PUBLISHED'}
                          title={blog.status === 'PUBLISHED' ? "Cannot delete a published post. Revert to Draft first." : ""}
                          onClick={() => setBlogToDelete(blog._id)}
                        >
                          <Trash2 size={13} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {blogs.map((blog) => (
                <div
                  key={blog._id}
                  className="group flex flex-col md:flex-row gap-5 rounded-xl border bg-white p-4 shadow-2xs hover:shadow-sm transition duration-150"
                >
                  {/* List Cover Image Container */}
                  <div className="relative aspect-video w-full md:w-48 overflow-hidden rounded-lg bg-slate-100 shrink-0">
                    {blog.coverImage ? (
                      <img
                        src={blog.coverImage.startsWith('http') ? blog.coverImage : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${blog.coverImage}`}
                        alt={blog.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1546074177-ffedd79d4c4b?w=600&auto=format&fit=crop&q=60'
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Newspaper size={32} />
                      </div>
                    )}
                    <span className={`absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs shadow-sm ${getTagBadgeStyle(blog.tag)}`}>
                      {blog.tag}
                    </span>
                  </div>

                  {/* List Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {getStatusBadge(blog.status)}
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar size={11} />
                          {formatDate(blog.createdAt)}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition duration-150 leading-snug truncate">
                        {blog.title}
                      </h3>

                      <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {blog.summary || 'No summary provided.'}
                      </p>

                      {blog.status === 'REJECTED' && blog.rejectionReason && (
                        <div className="mt-2 flex items-start gap-1 rounded bg-rose-50 p-2 text-[10px] text-rose-700 max-w-lg border border-rose-100">
                          <MessageSquareWarning size={12} className="shrink-0 mt-0.5 mr-1 text-rose-500" />
                          <div>
                            <span className="font-semibold">Reason: </span>
                            {blog.rejectionReason}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Eye size={13} />
                        {blog.views.toLocaleString()} views
                      </span>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-slate-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          disabled={blog.status === 'PENDING_APPROVAL'}
                          title={blog.status === 'PENDING_APPROVAL' ? "Cannot edit post while pending approval" : ""}
                          onClick={() => navigate(`/blogs/${blog._id}/edit`)}
                        >
                          Edit Post
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-750 transition disabled:opacity-50"
                          disabled={blog.status === 'PUBLISHED'}
                          title={blog.status === 'PUBLISHED' ? "Cannot delete a published post. Revert to Draft first." : ""}
                          onClick={() => setBlogToDelete(blog._id)}
                        >
                          <Trash2 size={13} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-xs text-slate-500 font-medium">
                Showing page <span className="font-semibold text-slate-900">{pagination.currentPage}</span> of{' '}
                <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
              </span>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={pagination.currentPage === 1}
                  className="h-8 border-slate-200"
                >
                  <ChevronLeft size={16} />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="h-8 border-slate-200"
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Deletion Confirmation Dialog */}
      <Dialog open={blogToDelete !== null} onOpenChange={(open) => !open && setBlogToDelete(null)}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Delete Blog Post</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete this blog post? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deleteError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 font-medium">
              {deleteError}
            </div>
          )}

          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-slate-200 text-xs font-semibold"
              onClick={() => setBlogToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-9 bg-rose-600 hover:bg-rose-750 text-white text-xs font-semibold"
              onClick={handleDeleteBlog}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 size={13} className="animate-spin mr-1" />
                  Deleting...
                </>
              ) : (
                'Confirm Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BlogsPage
