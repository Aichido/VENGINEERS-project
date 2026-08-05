// tests/lib/productImage.test.js
import { getPrimaryImage, getGalleryImages } from '../../src/lib/productImage'

describe('getPrimaryImage', () => {
  it('returns thumbnail_path of primary image if available', () => {
    const product = {
      id: 1,
      images: [
        { is_primary: true, thumbnail_path: 'thumb-primary.jpg', path: 'primary.jpg' },
        { is_primary: false, thumbnail_path: 'thumb-secondary.jpg', path: 'secondary.jpg' },
      ],
    }
    expect(getPrimaryImage(product)).toBe('thumb-primary.jpg')
  })

  it('returns thumbnail_path of first image if no primary', () => {
    const product = {
      id: 1,
      images: [
        { is_primary: false, thumbnail_path: 'thumb-first.jpg', path: 'first.jpg' },
        { is_primary: false, thumbnail_path: 'thumb-second.jpg', path: 'second.jpg' },
      ],
    }
    expect(getPrimaryImage(product)).toBe('thumb-first.jpg')
  })

  it('falls back to path if thumbnail_path is missing', () => {
    const product = {
      id: 1,
      images: [{ is_primary: true, path: 'primary.jpg' }],
    }
    expect(getPrimaryImage(product)).toBe('primary.jpg')
  })

  it('falls back to placeholder if no images', () => {
    const product = { id: 42, images: [] }
    const result = getPrimaryImage(product)
    expect(result).toMatch(/^https:\/\/picsum.photos\/seed\/product-42\/600\/400$/)
  })

  it('uses generic placeholder if product has no id', () => {
    const product = { images: [] }
    const result = getPrimaryImage(product)
    expect(result).toMatch(/^https:\/\/picsum.photos\/seed\/product-placeholder\/600\/400$/)
  })

  it('handles null/undefined product gracefully', () => {
    expect(getPrimaryImage(null)).toMatch(/^https:\/\/picsum.photos\/seed\/product-placeholder\/600\/400$/)
    expect(getPrimaryImage(undefined)).toMatch(/^https:\/\/picsum.photos\/seed\/product-placeholder\/600\/400$/)
  })
})

describe('getGalleryImages', () => {
  it('returns array of paths for all images, primary first, then by position', () => {
    const product = {
      id: 1,
      images: [
        { is_primary: false, path: 'img2.jpg', position: 1 },
        { is_primary: true, path: 'img1.jpg', position: 0 },
        { is_primary: false, path: 'img3.jpg', position: 2 },
      ],
    }
    expect(getGalleryImages(product)).toEqual(['img1.jpg', 'img2.jpg', 'img3.jpg'])
  })

  it('sorts by position when no primary', () => {
    const product = {
      id: 1,
      images: [
        { is_primary: false, path: 'imgB.jpg', position: 1 },
        { is_primary: false, path: 'imgA.jpg', position: 0 },
        { is_primary: false, path: 'imgC.jpg', position: 2 },
      ],
    }
    expect(getGalleryImages(product)).toEqual(['imgA.jpg', 'imgB.jpg', 'imgC.jpg'])
  })

  it('uses thumbnail_path if path is missing', () => {
    const product = {
      id: 1,
      images: [
        { is_primary: true, thumbnail_path: 'thumb-primary.jpg' },
        { is_primary: false, thumbnail_path: 'thumb-secondary.jpg' },
      ],
    }
    expect(getGalleryImages(product)).toEqual(['thumb-primary.jpg', 'thumb-secondary.jpg'])
  })

  it('returns placeholder array if no images', () => {
    const product = { id: 42, images: [] }
    expect(getGalleryImages(product)).toEqual([
      'https://picsum.photos/seed/product-42/800/600',
    ])
  })

  it('uses generic placeholder if product has no id and no images', () => {
    const product = { images: [] }
    expect(getGalleryImages(product)).toEqual([
      'https://picsum.photos/seed/product-placeholder/800/600',
    ])
  })

  it('handles null/undefined product gracefully', () => {
    expect(getGalleryImages(null)).toEqual([
      'https://picsum.photos/seed/product-placeholder/800/600',
    ])
    expect(getGalleryImages(undefined)).toEqual([
      'https://picsum.photos/seed/product-placeholder/800/600',
    ])
  })
})