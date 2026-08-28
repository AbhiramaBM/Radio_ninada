import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { deleteFileFromCloudinary, extractPublicIdFromUrl } from '../services/cloudinary.service';

export async function getSponsors(req: Request, res: Response, next: NextFunction) {
  try {
    const sponsors = await prisma.sponsor.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: sponsors });
  } catch (error) {
    next(error);
  }
}

export async function createSponsor(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    let logoUrl = req.body.logoUrl;
    let publicId = req.body.publicId || req.body.cloudinaryPublicId || null;

    if (file) {
      logoUrl = file.path && (file.path.startsWith('http://') || file.path.startsWith('https://')) ? file.path : `/uploads/${file.filename}`;
      publicId = (file as any).public_id || extractPublicIdFromUrl(logoUrl);
    }

    if (!publicId && logoUrl) {
      publicId = extractPublicIdFromUrl(logoUrl);
    }

    const { name, website, campaign, expiryDate, status } = req.body;

    const sponsor = await prisma.sponsor.create({
      data: {
        name,
        logoUrl: logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
        publicId,
        website,
        campaign: campaign || 'Brand Partnership',
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: status || 'ACTIVE',
      },
    });

    return res.status(201).json({ success: true, message: 'Sponsor added successfully', data: sponsor });
  } catch (error) {
    next(error);
  }
}

export async function trackSponsorClick(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.sponsor.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });
    return res.json({ success: true, message: 'Sponsor click registered' });
  } catch (error) {
    next(error);
  }
}

export async function deleteSponsor(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const sponsor = await prisma.sponsor.findUnique({ where: { id } });

    if (sponsor) {
      const pid = sponsor.publicId || extractPublicIdFromUrl(sponsor.logoUrl);
      if (pid) {
        await deleteFileFromCloudinary(pid, 'image');
      }
    }

    await prisma.sponsor.delete({ where: { id } });
    return res.json({ success: true, message: 'Sponsor removed' });
  } catch (error) {
    next(error);
  }
}

