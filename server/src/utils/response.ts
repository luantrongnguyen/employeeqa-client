import type { Response } from 'express'

export const ok = <T>(res: Response, data: T, message?: string) =>
  res.json({ data, ...(message && { message }) })

export const created = <T>(res: Response, data: T) =>
  res.status(201).json({ data })

export const noContent = (res: Response) => res.status(204).send()

export const badRequest = (res: Response, message: string) =>
  res.status(400).json({ error: message })

export const unauthorized = (res: Response, message = 'Unauthorized') =>
  res.status(401).json({ error: message })

export const forbidden = (res: Response, message = 'Forbidden') =>
  res.status(403).json({ error: message })

export const notFound = (res: Response, message = 'Not found') =>
  res.status(404).json({ error: message })

export const conflict = (res: Response, message: string) =>
  res.status(409).json({ error: message })

export const gone = (res: Response, message = 'Link has expired') =>
  res.status(410).json({ error: message })

export const serverError = (res: Response, message = 'Internal server error') =>
  res.status(500).json({ error: message })
