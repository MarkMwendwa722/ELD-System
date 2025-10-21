import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: 'Spotter TypeScript API is running',
    version: '1.0.0'
  });
}
