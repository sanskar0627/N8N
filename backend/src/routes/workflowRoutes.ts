import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();


router.post('/', async (req, res) => {
  try {
    const { data } = req.body;
    // NOTE: In a real app, you'd get the userId from an authenticated session.
    // For now, we'll use a placeholder.
    const userId = 'placeholder_user_id'; 

    const newWorkflow = await prisma.workflow.create({
      data: {
        data: data,
        userId: userId,
      },
    });

    res.status(201).json(newWorkflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ message: 'Failed to create workflow.' });
  }
});

// GET /workflow
router.get('/', async (req, res) => {
  try {
    // NOTE: Again, use a placeholder userId.
    const userId = 'placeholder_user_id';

    const workflows = await prisma.workflow.findMany({
      where: {
        userId: userId,
      },
    });

    res.status(200).json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ message: 'Failed to fetch workflows.' });
  }
});


export default router;