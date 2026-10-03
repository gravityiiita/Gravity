"use client"

import type React from "react"

import { useState } from "react"
import { useRef, useCallback } from "react"
import type { Member } from "@/lib/types"
import { wings } from "@/lib/data"
import { uploadToCloudinary } from "@/lib/cloudinary"
import MagicButton from "@/components/magic-button"

interface MemberFormProps {
  member?: Member
  onSubmit: (data: any) => void | Promise<void>
  onCancel: () => void
}

export function MemberForm({ member, onSubmit, onCancel }: MemberFormProps) {
  const [formData, setFormData] = useState<{
    name: string
    role: Member["role"]
    wing: string
    bio: string
    image: string
    isOverallCoordinator: boolean
    isFacultyCoordinator: boolean
    socials: {
      github: string
      linkedin: string
      twitter: string
      instagram: string
    }
  }>({
    name: member?.name || "",
    role: member?.role || "member",
    wing: member?.wing || "",
    bio: member?.bio || "",
    image: member?.image || "",
    isOverallCoordinator: member?.isOverallCoordinator || false,
    isFacultyCoordinator: member?.isFacultyCoordinator || false,
    socials: {
      github: member?.socials?.github || "",
      linkedin: member?.socials?.linkedin || "",
      twitter: member?.socials?.twitter || "",
      instagram: member?.socials?.instagram || "",
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      socials: { ...prev.socials, [name]: value },
    }))
  }

  const [uploading, setUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // Cropping state
  const [cropping, setCropping] = useState(false)
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [rawFileName, setRawFileName] = useState<string | null>(null)
  const [crop, setCrop] = useState<{ x: number; y: number; size: number } | null>(null)
  const [dragStart, setDragStart] = useState<{ offsetX: number; offsetY: number } | null>(null)
  const imageContainerRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const onImageLoaded = () => {
    if (!imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const size = Math.min(w, h)
    setCrop({ x: (w - size) / 2, y: (h - size) / 2, size })
  }

  const startCrop = (e: React.MouseEvent) => {
    if (!imageContainerRef.current || !crop) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    // Calculate offset from current crop top-left and clamp inside square
    const offsetX = Math.min(Math.max(x - crop.x, 0), crop.size)
    const offsetY = Math.min(Math.max(y - crop.y, 0), crop.size)
    setDragStart({ offsetX, offsetY })
  }

  const moveCrop = (e: React.MouseEvent) => {
    if (!dragStart || !imageContainerRef.current || !crop) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    let newX = x - dragStart.offsetX
    let newY = y - dragStart.offsetY
    // Clamp within image bounds
    newX = Math.max(0, Math.min(rect.width - crop.size, newX))
    newY = Math.max(0, Math.min(rect.height - crop.size, newY))
    setCrop({ x: newX, y: newY, size: crop.size })
  }

  const endCrop = () => {
    setDragStart(null)
  }

  const resetCropState = () => {
    setCropping(false)
    setRawImage(null)
    setRawFileName(null)
    setCrop(null)
    setDragStart(null)
  }

  const processDataUrl = useCallback(async (dataUrl: string, originalName: string | null) => {
    try {
      if (
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      ) {
        setUploading(true)
        const blob = await (await fetch(dataUrl)).blob()
        const safeName = (originalName || 'image').replace(/\.[^.]+$/, '.jpg')
        const outFile = new File([blob], safeName, { type: 'image/jpeg' })
        const url = await uploadToCloudinary(outFile)
        setFormData((prev) => ({ ...prev, image: url }))
      } else {
        setFormData((prev) => ({ ...prev, image: dataUrl }))
      }
    } catch (err) {
      console.error(err)
      setFormData((prev) => ({ ...prev, image: dataUrl }))
    } finally {
      setUploading(false)
      resetCropState()
    }
  }, [])

  const confirmCrop = async () => {
    if (!rawImage || !crop || !imageContainerRef.current) return
    const img = new Image()
    img.onload = () => {
      // Determine scale between displayed image and natural size
      const displayWidth = imageContainerRef.current!.clientWidth
      const displayHeight = imageContainerRef.current!.clientHeight
      const scaleX = img.naturalWidth / displayWidth
      const scaleY = img.naturalHeight / displayHeight
      const sx = Math.round(crop.x * scaleX)
      const sy = Math.round(crop.y * scaleY)
      const sSize = Math.round(crop.size * Math.min(scaleX, scaleY))
      const MAX_DIM = 512
      let targetSize = sSize
      if (targetSize > MAX_DIM) targetSize = MAX_DIM
      const canvas = document.createElement('canvas')
      canvas.width = targetSize
      canvas.height = targetSize
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          img,
          sx,
          sy,
          sSize,
          sSize,
          0,
          0,
          targetSize,
          targetSize
        )
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        processDataUrl(dataUrl, rawFileName)
      }
    }
    img.src = rawImage
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      setRawImage(reader.result as string)
      setRawFileName(file.name)
      setCropping(true)
      setCrop(null)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError("")
    const payload = {
      ...member,
      ...formData,
      socials: {
        github: formData.socials.github.trim(),
        linkedin: formData.socials.linkedin.trim(),
        twitter: formData.socials.twitter.trim(),
        instagram: formData.socials.instagram.trim(),
      },
    }
    if (!payload.image) {
      payload.image = '/gravity-logo.png'
    }
    try {
      await onSubmit(payload)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to save member")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="member">Member</option>
            <option value="coordinator">Coordinator</option>
          </select>
        </div>
      </div>

      {!(formData.role === "coordinator" && (formData.isOverallCoordinator || formData.isFacultyCoordinator)) && (
        <div>
          <label className="block text-sm font-medium mb-2">Wing</label>
          <select
            name="wing"
            value={formData.wing}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select a wing</option>
            {wings.map((wing) => (
              <option key={wing.id} value={wing.name}>
                {wing.name}
              </option>
            ))}
          </select>
          {/* Quick toggle to make this person a coordinator of the selected wing */}
          {formData.wing && formData.role !== "coordinator" && (
            <label className="mt-3 inline-flex items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={false}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.checked ? "coordinator" : "member" }))
                }
                className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm font-medium">Coordinator for this wing</span>
            </label>
          )}
        </div>
      )}

      {formData.role === "coordinator" && (
        <div className="flex items-center gap-2">
          <input
            id="overallCoordinator"
            type="checkbox"
            checked={formData.isOverallCoordinator}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isOverallCoordinator: e.target.checked }))
            }
            className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="overallCoordinator" className="text-sm font-medium">
            Overall Coordinator
          </label>
        </div>
      )}

      {formData.role === "coordinator" && (
        <div className="flex items-center gap-2">
          <input
            id="facultyCoordinator"
            type="checkbox"
            checked={formData.isFacultyCoordinator}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isFacultyCoordinator: e.target.checked }))
            }
            className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="facultyCoordinator" className="text-sm font-medium">
            Faculty Coordinator
          </label>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Enter member bio"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Social Links</label>
        <div className="grid md:grid-cols-2 gap-3">
          <input
            type="text"
            name="linkedin"
            value={formData.socials.linkedin}
            onChange={handleSocialChange}
            placeholder="LinkedIn URL"
            className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            name="github"
            value={formData.socials.github}
            onChange={handleSocialChange}
            placeholder="GitHub URL"
            className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            name="twitter"
            value={formData.socials.twitter}
            onChange={handleSocialChange}
            placeholder="X / Twitter URL"
            className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            name="instagram"
            value={formData.socials.instagram}
            onChange={handleSocialChange}
            placeholder="Instagram URL"
            className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Profile Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={cropping || uploading}
          className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground file:bg-primary file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 cursor-pointer"
        />
        {cropping && rawImage && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-foreground/60">Drag the square to reposition, then apply.</p>
            <div
              ref={imageContainerRef}
              onMouseDown={startCrop}
              onMouseMove={moveCrop}
              onMouseUp={endCrop}
              className="relative inline-block select-none border border-border rounded"
              style={{ cursor: 'crosshair' }}
            >
              <img
                ref={imageRef}
                onLoad={onImageLoaded}
                src={rawImage}
                alt="To crop"
                className="max-h-96 max-w-full block"
                draggable={false}
              />
              {crop && (
                <div
                  className="absolute border-2 border-primary/80 bg-primary/10"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.size,
                    height: crop.size,
                  }}
                />
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmCrop}
                disabled={!crop || uploading}
                className="px-3 py-2 text-sm font-medium rounded bg-primary text-white disabled:opacity-50"
              >
                Apply Crop
              </button>
              <button
                type="button"
                onClick={resetCropState}
                className="px-3 py-2 text-sm font-medium rounded bg-card border border-border"
              >
                Cancel Crop
              </button>
            </div>
          </div>
        )}
        {uploading && <p className="mt-2 text-sm text-foreground/60">Uploading image...</p>}
        {formData.image && (
          <div className="mt-2 flex items-center gap-3">
            <div className="relative w-20 h-20">
              <img
                src={formData.image || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <span className="text-xs text-foreground/50 max-w-40 truncate">Image ready</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <MagicButton type="submit" className="flex-1" heightClass="h-11" disabled={uploading || isSubmitting}>
          {isSubmitting ? "Saving..." : member ? "Update" : "Add"} Member
        </MagicButton>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg bg-card border border-border text-foreground font-medium hover:bg-card/80 transition-all"
        >
          Cancel
        </button>
      </div>
      {submitError && <p className="text-sm text-red-500">{submitError}</p>}
    </form>
  )
}


