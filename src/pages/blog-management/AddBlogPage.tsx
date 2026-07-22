import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Eye,
  Edit3,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react'
import api from '@/services/api'
import { marked } from 'marked'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export const CATEGORY_MAP: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  'General': { label: 'General', dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  'Travel Guides': { label: 'Travel Guides', dot: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  'Destinations': { label: 'Destinations', dot: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  'Transit News': { label: 'Transit News', dot: 'bg-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
}

function AddBlogPage() {
  const navigate = useNavigate()

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#add-blog-header',
          popover: {
            title: 'Create Blog Post Tour',
            description: 'This quick tour will guide you through writing and publishing your blog article.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#add-blog-title',
          popover: {
            title: 'Blog Title',
            description: 'Enter a catchy and descriptive title for your article. It must contain at least 5 characters.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#add-blog-editor',
          popover: {
            title: 'Markdown Content Editor',
            description: 'Compose your content in the **Write** tab using simple Markdown. Toggle the **Preview** tab to check the generated HTML view.<br/><br/><strong>Markdown Formatting Guide:</strong><br/>• <code># Heading 1</code> (Main title)<br/>• <code>## Heading 2</code> (Sub-heading)<br/>• <code>**bold text**</code> (Highlight key words)<br/>• <code>*italic text*</code> (Emphasis)<br/>• <code>- Bullet point item</code> (Lists)',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#add-blog-settings',
          popover: {
            title: 'Settings & Metadata',
            description: 'Assign a tag category to organize your post, and write a brief summary (max 300 characters) to show as a teaser.',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#add-blog-cover',
          popover: {
            title: 'Cover Image',
            description: 'Upload a high-quality cover photo (JPG, PNG) to make your blog post visually appealing.',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#add-blog-actions',
          popover: {
            title: 'Publish or Save Draft',
            description: 'Click <strong>Submit for Approval</strong> to send it to the Admin for review and publishing. Or click <strong>Save as Draft</strong> to keep working on it privately.',
            side: 'left',
            align: 'start'
          }
        }
      ],
      onDestroyed: () => {
        localStorage.setItem('hasSeenAddBlogTour', 'true')
      }
    })
    driverObj.drive()
  }

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenAddBlogTour')
    if (hasSeen !== 'true') {
      const timer = setTimeout(() => {
        startTour()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const [title, setTitle] = useState('')
  const [tag, setTag] = useState('General')
  const [summary, setSummary] = useState('')
  const [markdownContent, setMarkdownContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // Editor Tabs: 'edit' or 'preview'
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  // Handle Cover Image Upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await api.post('/upload?folder=busnet_blogs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      if (res.data?.success) {
        setCoverImage(res.data.url)
      } else {
        setErrorMsg('Upload image failed. Please try again.')
      }
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setErrorMsg(err.response?.data?.message || 'Error uploading image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle Save
  const handleSave = async (status: 'DRAFT' | 'PENDING_APPROVAL') => {
    if (!title.trim() || title.trim().length < 5) {
      setErrorMsg('Title must be at least 5 characters.')
      return
    }
    if (!markdownContent.trim()) {
      setErrorMsg('Content cannot be empty.')
      return
    }
    if (!coverImage) {
      setErrorMsg('Please select or upload a cover image.')
      return
    }

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // Compile Markdown to HTML before saving to database for 100% compatibility
      const compiledHtml = marked.parse(markdownContent)

      const res = await api.post('/partner/blogs', {
        title: title.trim(),
        content: compiledHtml, // Save compiled HTML
        markdown: markdownContent, // Save raw Markdown
        summary: summary.trim(),
        tag,
        coverImage,
        status,
      })

      if (res.data?.success) {
        setSuccessMsg(
          status === 'PENDING_APPROVAL'
            ? 'Blog post submitted for approval successfully! Redirecting...'
            : 'Blog post saved as draft successfully! Redirecting...'
        )
        setTimeout(() => {
          navigate('/blogs')
        }, 2000)
      }
    } catch (err: any) {
      console.error('Error creating blog post:', err)
      if (err.response?.data?.errors) {
        setErrorMsg(err.response.data.errors[0]?.msg || 'Invalid input information.')
      } else {
        setErrorMsg(err.response?.data?.message || 'An error occurred while creating the blog post.')
      }
    } finally {
      setSaving(false)
    }
  }

  const renderPreview = () => {
    try {
      return marked.parse(markdownContent)
    } catch (e) {
      return markdownContent
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between" id="add-blog-header">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-slate-200"
            onClick={() => navigate('/blogs')}
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Write New Post</h2>
            <p className="text-xs text-slate-500">
              Create articles, travel guides, or news using Markdown.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          id="add-blog-tour-btn"
          className="border-slate-200 text-slate-600 hover:bg-slate-50 transition duration-200 h-9 text-xs"
          onClick={startTour}
        >
          <HelpCircle size={14} className="mr-1" />
          Guide Tour
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main Editor Section */}
        <div className="space-y-6">
          {/* Main Card */}
          <div className="rounded-xl border bg-white p-6 shadow-2xs space-y-4">
            {/* Title Input */}
            <div id="add-blog-title" className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-slate-700">
                Blog Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter a catchy title for the post..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-base font-semibold"
              />
            </div>

            {/* Editor Tabs & Body Content */}
            <div id="add-blog-editor" className="space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Blog Content (Markdown) <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer transition"
                      >
                        <HelpCircle size={13} />
                        Markdown Guide
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-white border border-slate-200 shadow-lg">
                      <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">Markdown Guide</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 text-xs text-slate-600 leading-relaxed max-h-[400px] overflow-y-auto pr-2 mt-2">
                        <p className="text-slate-500 font-medium">Use these simple Markdown patterns in the Write editor:</p>
                        <table className="w-full text-[11px] text-left border-collapse border border-slate-100">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                              <th className="py-2 px-3 font-semibold">Element</th>
                              <th className="py-2 px-3 font-semibold">Syntax Example</th>
                              <th className="py-2 px-3 font-semibold">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="py-2 px-3 font-medium text-slate-900">Heading 1</td>
                              <td className="py-2 px-3 font-mono"># Heading 1</td>
                              <td className="py-2 px-3 font-bold text-slate-900">Heading 1</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium text-slate-900">Heading 2</td>
                              <td className="py-2 px-3 font-mono">## Heading 2</td>
                              <td className="py-2 px-3 font-bold text-slate-800 text-xs">Heading 2</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium text-slate-900">Bold</td>
                              <td className="py-2 px-3 font-mono">**bold text**</td>
                              <td className="py-2 px-3 font-bold text-slate-900">bold text</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium text-slate-900">Italic</td>
                              <td className="py-2 px-3 font-mono">*italic text*</td>
                              <td className="py-2 px-3 italic">italic text</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium text-slate-900">List Item</td>
                              <td className="py-2 px-3 font-mono">- Bullet item</td>
                              <td className="py-2 px-3">• Bullet item</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium text-slate-900">Link</td>
                              <td className="py-2 px-3 font-mono">[BusNet](url)</td>
                              <td className="py-2 px-3 text-blue-600 underline">BusNet</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium text-slate-900">Image</td>
                              <td className="py-2 px-3 font-mono">![Alt](image_url)</td>
                              <td className="py-2 px-3 text-slate-400 italic">Image</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium text-slate-900">Quote</td>
                              <td className="py-2 px-3 font-mono">&gt; Travel tip</td>
                              <td className="py-2 px-3 border-l-2 border-slate-300 pl-2 text-slate-500 italic">Travel tip</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex rounded-lg bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                      activeTab === 'edit'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Edit3 size={13} />
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Eye size={13} />
                    Preview
                  </button>
                </div>
              </div>
            </div>

              {activeTab === 'edit' ? (
                <div className="space-y-1">
                  <Textarea
                    placeholder="Write content using Markdown (e.g. ## Heading 2, **bold text**, - list items...)"
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    className="min-h-[350px] font-mono text-sm leading-relaxed border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                    <Sparkles size={10} className="text-blue-500" />
                    Tip: You can use standard Markdown tags like #, ##, **, -, * to style your content layout.
                  </p>
                </div>
              ) : (
                <div className="min-h-[350px] rounded-lg border border-slate-100 bg-slate-50/50 p-5 overflow-y-auto">
                  {markdownContent.trim() ? (
                    <article
                      className="prose prose-sm max-w-none text-slate-800 space-y-4"
                      dangerouslySetInnerHTML={{ __html: renderPreview() }}
                    />
                  ) : (
                    <div className="flex h-[300px] flex-col items-center justify-center text-slate-400">
                      <Eye size={36} className="mb-2 stroke-[1.5]" />
                      <p className="text-sm font-medium">No content to display for preview yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info Section (Settings & Meta) */}
        <div className="space-y-6">
          {/* Settings Panel */}
          <div id="add-blog-settings" className="rounded-xl border bg-white p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide border-b pb-2">Post Settings</h3>

            {/* Tag Selection */}
            <div className="space-y-2">
              <Label htmlFor="tag" className="text-xs font-semibold text-slate-600">Category (Tag)</Label>
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger id="tag" className="border-slate-200">
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CATEGORY_MAP).map((key) => {
                    const cat = CATEGORY_MAP[key]
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${cat.dot}`} />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Summary Input */}
            <div className="space-y-2">
              <Label htmlFor="summary" className="text-xs font-semibold text-slate-600">Short Summary</Label>
              <Textarea
                id="summary"
                placeholder="Briefly summarize the post content in under 300 characters..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={300}
                className="h-24 resize-none text-xs leading-normal border-slate-200"
              />
            </div>
          </div>

          {/* Cover Image Upload Card */}
          <div id="add-blog-cover" className="rounded-xl border bg-white p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide border-b pb-2">Post Cover Image</h3>

            <div className="space-y-3">
              {coverImage ? (
                <div className="relative group aspect-video w-full overflow-hidden rounded-lg border bg-slate-100">
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition duration-150">
                    <label className="cursor-pointer rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-white">
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video w-full cursor-pointer rounded-lg border border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-blue-400 transition duration-150">
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-1.5 text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="text-xs font-medium">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400">
                      <ImageIcon size={28} />
                      <span className="text-xs font-medium">Upload Cover Image</span>
                      <span className="text-[9px] text-slate-400">JPG, PNG formats</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Action Actions Panel */}
          <div id="add-blog-actions" className="space-y-2">
            {errorMsg && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700 font-medium flex items-center gap-1.5">
                <CheckCircle2 size={14} className="shrink-0" />
                {successMsg}
              </div>
            )}

            <Button
              className="w-full bg-blue-600 text-white hover:bg-blue-700 h-10 font-medium transition cursor-pointer"
              onClick={() => handleSave('PENDING_APPROVAL')}
              disabled={saving || uploadingImage}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-1.5" />
                  Processing...
                </>
              ) : (
                'Submit for Approval'
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full border-slate-200 h-10 text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
              onClick={() => handleSave('DRAFT')}
              disabled={saving || uploadingImage}
            >
              {saving ? 'Processing...' : 'Save as Draft'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddBlogPage
